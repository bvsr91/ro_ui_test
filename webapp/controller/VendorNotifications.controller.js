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
        "./modules/utilController"
    ],
    function (
        BaseController, JSONModel, Filter, Sorter, FilterOperator, GroupHeaderListItem, Device, Fragment, formatter,utilController) {
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
                // var oInput= oEvent.getSource().getSelectedItem().getBindingContext().getObject();
                // var oTable = this.getView().byId("idSTabVendorNoti");          //Get hold of table
                // var oRowsBinding = oTable.getBinding("rows");
                // oRowsBinding.attachChange(function(){
                //      var oLength = oRowsBinding.getLength();
                //      console.log(oLength);          //Gets you the rows length
                // var oTable=oEvent.getParameter("selectedItem");
                var oTable=this.getView().byId("idUiTabVendorNoti").getTable.getBinding();
                var path=oTable.sPath;
                this.byId("idSTabVendorNoti").getTable().getBinding().sPath;
            

            },
            handleReject:function(oEvent) {
                var oInput=oEvent.getSource();
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
