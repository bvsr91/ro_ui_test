sap.ui.define(
    [
        "./BaseController",
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/Filter",
        "sap/ui/model/Sorter",
        "sap/ui/model/FilterOperator",
        "sap/m/GroupHeaderListItem",
        "sap/ui/Device",
        "sap/ui/core/Fragment",
        "../model/formatter",
        "./modules/utilController",
        "sap/m/MessageBox"
    ],
    function (
        BaseController, JSONModel, Filter, Sorter, FilterOperator, GroupHeaderListItem, Device,
        Fragment, formatter, utilController, MessageBox) {
        "use strict";

        return BaseController.extend("com.ferrero.zmrouiapp.controller.VendorNotifications", {
            formatter: formatter,

            /* =========================================================== */
            /* lifecycle methods                                           */
            /* =========================================================== */

            /**
             * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
             * @public
             */
            onInit: function () {
                this.getRouter().getRoute("vendNoti").attachPatternMatched(this._onRouteMatched, this);
                var that = this;
                var oHashChanger = new sap.ui.core.routing.HashChanger.getInstance();
                oHashChanger.attachEvent("hashChanged", function (oEvent) {
                    that.routeAuthValidation(oHashChanger.getHash());
                });
                // this.extendTable();
                // this.getRouter().attachBypassed(this.onBypassed, this);
            },

            /* =========================================================== */
            /* event handlers                                              */
            /* =========================================================== */

            /**
             * Event handler for navigating back.
             * We navigate back in the browser historz
             * @public
             */
            onNavBack: function () {
                // eslint-disable-next-line sap-no-history-manipulation
                history.go(-1);
            },

            /* =========================================================== */
            /* begin: internal methods                                     */
            /* =========================================================== */

            _onRouteMatched: function () {
                //Set the layout property of the FCL control to 'OneColumn'
                // this.getModel("appView").setProperty("/layout", "OneColumn");
                this.setSelKey("vendNoti");
            },
            onBeforeRebindTable: async function (oEvent) {
                var mBindingParams = oEvent.getParameter("bindingParams"),
                    // oSmtFilter = this.getView().byId("idSTabPrcingNoti"),
                    oModel = this.getOwnerComponent().getModel(),
                    sTabSelKey = this.getView().byId("idIconTabBar").getSelectedKey();
                var oUserModel = this.getOwnerComponent().getModel("userModel");
                var role = oUserModel.getData().role;
                // var aTokens = oObjId.getTokens();
                var sFieldName;
                if (!role) {
                    await this.validateUser();
                } else {
                    if (role.role_role) {
                        if (role.role_role === "CDT" || role.role_role === "LDT") {
                            sFieldName = "createdBy";
                        } else {
                            sFieldName = "approver"
                        }
                        var aFilter = [];
                        var newFilter = new Filter(sFieldName, FilterOperator.EQ, role.userid);
                        // }
                        mBindingParams.filters.push(newFilter);
                    }
                    if (sTabSelKey !== "All" && sTabSelKey !== "") {
                        mBindingParams.filters.push(new Filter("status_code", FilterOperator.EQ, sTabSelKey));
                    }
                }
                oModel.attachRequestFailed(this._showError, this);
                oModel.attachRequestCompleted(this._detach, this);
            },
            _showError: function (oResponse) {
                var oModel = this.getView().getModel(),
                    oMsgs = oResponse.getSource().getMessagesByEntity("/VendorNotifications");
                if (oMsgs[0]) {
                    MessageBox.error(oMsgs[0].message);
                    oModel.detachRequestFailed(this._showError, this);
                }
            },
            _detach: function (oEvent) {
                var oModel = this.getView().getModel();
                if (oEvent.getParameter("success") === true) {
                    oModel.detachRequestFailed(this._showError, this);
                }
                oModel.detachRequestCompleted(this._detach, this);
            },
            onFilterSelect: function (oEvent) {
                var sKey = oEvent.getParameter("key");
                this.getView().byId("idSTabVendorNoti").rebindTable(true);
            },
            handleApprove: function (oEvent) {
                var aSelIndices = this.getView().byId("idUiTabVendorNoti").getSelectedIndices();
                var aRows = this.getView().byId("idUiTabVendorNoti").getRows();
                var aUpdatPaths = [];
                if (aSelIndices.length === 0) {
                    MessageBox.warning("Please atleast one row");
                } else {
                    for (var a of aSelIndices) {
                        aUpdatPaths.push(aRows[a].getBindingContext().sPath);
                    }
                    this.performBatchApprove(aUpdatPaths);
                }
            },
            performBatchApprove: function (aPaths) {
                var oModel = this.getOwnerComponent().getModel();
                // oModel.setUseBatch(true);
                oModel.attachRequestSent(function () {
                    sap.ui.core.BusyIndicator.show();
                });
                //hide busy
                oModel.attachRequestCompleted(function () {
                    sap.ui.core.BusyIndicator.hide();
                });
                //hide busy if request is failed
                oModel.attachRequestFailed(function () {
                    sap.ui.core.BusyIndicator.hide();
                });
                oModel.setUseBatch(true);
                oModel.setDeferredGroups(["foo"]);
                var mParameters = {
                    groupId: "foo",
                    success: function (odata, resp) {
                        var dialog1 = new sap.m.BusyDialog();
                        dialog1.open();
                        console.log(resp);
                        dialog1.close();
                    },
                    error: function (odata, resp) {
                        console.log(resp);
                    }
                };
                var operations = [];
                for (var i of aPaths) {
                    var oUpdatePayLoad = {
                        status_code: "Approved"
                    };
                    var operation = oModel.update(i, oUpdatePayLoad, mParameters);
                    operations.push(operation);
                }
                // oModel.addBatchChangeOperations(operations);
                var successBatch = function (data) {
                    console.log("Batch success!!!   ");
                }
                var errorBatch = function (err) {
                    console.log("Batch error!!!   ");
                }
                oModel.submitChanges(mParameters);
            },
            handleReject: function (oEvent) {
                var oInput = oEvent.getSource();
                var oDialogRej = utilController.createDialog(oEvent);
                oDialogRej.open();

                MessageBox.confirm("Do you want to delete the record?", {
                    actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
                    initialFocus: MessageBox.Action.CANCEL,
                    onClose: function (sAction) {
                        if (sAction === "YES") {
                            this.onConfirmDelete(this._oDelObjContext);
                        }
                    }.bind(this),
                }
                );
            }
        });
    }
);
