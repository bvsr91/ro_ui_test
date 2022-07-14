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
        "sap/ui/table/RowAction",
        "sap/ui/table/RowActionItem",
        "sap/ui/table/RowSettings"
    ],
    function (
        BaseController, JSONModel, Filter, Sorter, FilterOperator, GroupHeaderListItem,
        Device, Fragment, formatter, RowAction, RowActionItem, RowSettings) {
        "use strict";

        return BaseController.extend("com.ferrero.zmrouiapp.controller.PricingNotifications", {
            formatter: formatter,

            /* =========================================================== */
            /* lifecycle methods                                           */
            /* =========================================================== */

            /**
             * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
             * @public
             */
            onInit: function () {
                this.getRouter().getRoute("pricingNoti").attachPatternMatched(this._onRouteMatched, this);
                var that = this;
                var oHashChanger = new sap.ui.core.routing.HashChanger.getInstance();
                oHashChanger.attachEvent("hashChanged", function (oEvent) {
                    that.routeAuthValidation(oHashChanger.getHash());
                });
                this.extendTable();
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
                this.setSelKey("pricingNoti");
                this.getView().byId("idSTabPrcingNoti").rebindTable(true);
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
                    oMsgs = oResponse.getSource().getMessagesByEntity("/PricingNotifications");
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
                this.getView().byId("idSTabPrcingNoti").rebindTable(true);
            },
            extendTable: function () {
                var oTable = this.byId("idUiTabPricingNoti");
                var fnPress = this.handleActionPress.bind(this);
                var oTemplate = oTable.getRowActionTemplate();
                if (oTemplate) {
                    oTemplate.destroy();
                    oTemplate = null;
                }
                var iCount;
                this.modes = [
                    {
                        key: "Multi",
                        text: "Multiple Actions",
                        handler: function () {
                            var oTemplate = new RowAction({
                                items: [
                                    new RowActionItem({ icon: "sap-icon://action", text: "Action", press: fnPress })
                                ]
                            });
                            return [1, oTemplate];
                        }
                    }
                ];
                for (var i = 0; i < this.modes.length; i++) {
                    if ("Multi" == this.modes[i].key) {
                        var aRes = this.modes[i].handler();
                        iCount = aRes[0];
                        oTemplate = aRes[1];
                        break;
                    }
                }
                oTable.setRowActionTemplate(oTemplate);
                oTable.setRowActionCount(iCount);
            },
            handleActionPress: function (oEvent) {
                var oInput = oEvent.getSource().getParent();
                var bEdit;
                var bDelete;
                var oRecordCreator = oInput.getBindingContext().getObject().createdBy;
                var logOnUserObj = this.getOwnerComponent().getModel("userModel").getProperty("/role");
                if (logOnUserObj.userid && oRecordCreator.toLowerCase() === logOnUserObj.userid.toLowerCase()) {
                    bEdit = true;
                    bDelete = true;
                } else {
                    bEdit = false;
                    bDelete = false
                }
                var oPopover = new sap.m.Popover({
                    placement: "Auto",
                    showHeader: false,
                    content: [
                        new sap.m.VBox({
                            items: [
                                new sap.m.Button({
                                    text: 'Approve', icon: 'sap-icon://accept', type: 'Transparent', width: '6rem', enabled: bEdit,
                                    type: "Accept",
                                    press: this.onPressApprove.bind(this, oInput)
                                }),
                                new sap.m.Button({
                                    text: 'Delete', icon: 'sap-icon://delete', type: 'Transparent', width: '6rem', enabled: bDelete,
                                    // press: this.onDeleteAwaitConfirm.bind(this, oInput)
                                }),
                                new sap.m.Button({
                                    text: 'History', icon: 'sap-icon://history', type: 'Transparent', width: '6rem',
                                    // press: this.onHistoryClick.bind(this, oInput)
                                })
                            ]
                        }).addStyleClass("sapUiTinyMargin"),
                    ],
                }).addStyleClass("sapUiResponsivePadding");
                this._oPopover = oPopover;
                oPopover.openBy(oInput);
            },
            onPressApprove: function (oInput) {
                var oModel = this.getOwnerComponent().getModel();
                var oSelObj = oInput.getBindingContext().getObject();
                var oActionUriParameters = {
                    uuid: oSelObj.uuid,
                    Pricing_Conditions_manufacturerCode: oSelObj.Pricing_Conditions_manufacturerCode,
                    Pricing_Conditions_manufacturerCode: oSelObj.Pricing_Conditions_manufacturerCode,
                    status_code: "Approved"
                };
                oModel.update(oInput.getBindingContext().sPath, oActionUriParameters, {
                    success: function (oData) {
                        this.getView().byId("idSTabPrcingNoti").rebindTable(true);
                        this._oPopover.close();
                        // debugger;
                    }.bind(this),
                    error: function (error) {
                        // debugger;
                    }
                });
                // oModel.callFunction("/approvePricing", {
                //     method: "POST",
                //     urlParameters: oActionUriParameters,
                //     success: function (oData) {
                //         this.getView().byId("idSTabPrcingNoti").rebindTable(true);
                //         this._oPopover.close();
                //         // debugger;
                //     }.bind(this),
                //     error: function (error) {
                //         // debugger;
                //     }
                // });
            }
        });
    }
);
