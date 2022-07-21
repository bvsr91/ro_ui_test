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
        "sap/ui/table/RowSettings",
        "sap/m/MessageBox",
        "sap/m/Dialog",
        "sap/m/Button",
        "sap/m/Label",
        "sap/m/library",
        "sap/m/MessageToast",
        "sap/m/Text",
        "sap/m/TextArea",
    ],
    function (
        BaseController, JSONModel, Filter, Sorter, FilterOperator, GroupHeaderListItem,
        Device, Fragment, formatter, RowAction, RowActionItem, RowSettings, MessageBox,
        Dialog, Button, Label, mobileLibrary, MessageToast, Text, TextArea) {

        "use strict";

        // shortcut for sap.m.ButtonType
        var ButtonType = mobileLibrary.ButtonType;
        // shortcut for sap.m.DialogType
        var DialogType = mobileLibrary.DialogType;

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
                this._sEntitySet;
                var sFieldName;
                if (!role) {
                    await this.validateUser();
                }
                if (role.role_role) {
                    if (role.role_role === "CDT" || role.role_role === "LDT") {
                        // sFieldName = "createdBy";
                        this.getView().byId("idSTabPrcingNoti").setEntitySet("PricingNotifications_U");
                        this._sEntitySet = "PricingNotifications_U";
                    } else {
                        // sFieldName = "approver"
                        this.getView().byId("idSTabPrcingNoti").setEntitySet("PricingNotifications_A");
                        this._sEntitySet = "PricingNotifications_A";
                    }
                    // var aFilter = [];
                    // var newFilter = new Filter(sFieldName, FilterOperator.EQ, role.userid);
                    // // }
                    // mBindingParams.filters.push(newFilter);
                }
                if (sTabSelKey !== "All" && sTabSelKey !== "") {
                    if (role.role_role === "CDT") {
                        var aFilter = [];
                        aFilter.push(new Filter("status_code", FilterOperator.NE, "In Progress"));
                        aFilter.push(new Filter("status_code", FilterOperator.NE, "Forwarded"));
                        aFilter.push(new Filter("status_code", FilterOperator.EQ, sTabSelKey));
                        var oFilter = new Filter({
                            filters: aFilter,
                            and: true,
                        });
                        mBindingParams.filters.push(oFilter);
                    } else {
                        mBindingParams.filters.push(new Filter("status_code", FilterOperator.EQ, sTabSelKey));
                    }
                } else {
                    if (role.role_role === "CDT") {
                        var aFilter = [];
                        aFilter.push(new Filter("status_code", FilterOperator.NE, "In Progress"));
                        aFilter.push(new Filter("status_code", FilterOperator.NE, "Forwarded"));
                        // aFilter.push(new Filter("status_code", FilterOperator.EQ, sTabSelKey));
                        var oFilter = new Filter({
                            filters: aFilter,
                            and: true,
                        });
                        mBindingParams.filters.push(oFilter);
                    }
                }

                oModel.attachRequestFailed(this._showError, this);
                oModel.attachRequestCompleted(this._detach, this);
            },
            _showError: function (oResponse) {
                var oModel = this.getView().getModel(),
                    oMsgs = oResponse.getSource().getMessagesByEntity("/" + this._sEntitySet);
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
                var bEdit, bDelete, bAccept;
                var oSelObj = oInput.getBindingContext().getObject();
                var oRecordApprover = oInput.getBindingContext().getObject().approver;
                var oObj = this.getOwnerComponent().getModel("userModel").getProperty("/role");
                if (oObj.userid && oRecordApprover.toLowerCase() === oObj.userid.toLowerCase()) {
                    bEdit = true;
                    bDelete = true;
                } else {
                    bEdit = false;
                    bDelete = false
                }
                if (oSelObj.status_code === "Forwarded") {
                    bAccept = true;
                } else {
                    bAccept = false;
                }
                var oActionSheet = new sap.m.ActionSheet({
                    placement: "VerticalPreferredBottom",
                    buttons: [
                        new sap.m.Button({
                            text: 'Accept', type: 'Transparent', width: '6rem', visible: bAccept,
                            press: this.onPressAccept.bind(this, oInput)
                        }),
                        new sap.m.Button({
                            text: 'Approve', type: 'Transparent', width: '6rem', enabled: bEdit,
                            press: this.onPressApprove.bind(this, oInput)
                        }),
                        new sap.m.Button({
                            text: 'Reject', type: 'Transparent', width: '6rem', enabled: bEdit,
                            press: this.onPressReject.bind(this, oInput)
                        }),
                        new sap.m.Button({
                            text: 'History', type: 'Transparent', width: '6rem',
                            // press: this.onHistoryClick.bind(this, oInput)
                        })
                    ]
                });
                oActionSheet.openBy(oInput);
            },
            onPressApprove: async function (oInput) {
                var oModel = this.getOwnerComponent().getModel();
                var logOnUserObj = this.getOwnerComponent().getModel("userModel").getProperty("/role");
                var oSelObj = oInput.getBindingContext().getObject();
                var oActionUriParameters = {
                    uuid: oSelObj.uuid,
                    Pricing_Conditions_manufacturerCode: oSelObj.Pricing_Conditions_manufacturerCode,
                    Pricing_Conditions_countryCode_code: oSelObj.Pricing_Conditions_countryCode_code,
                    completionDate: new Date().toISOString(),
                    approvedDate: new Date().toISOString(),
                    approver: logOnUserObj.userid,
                    status_code: "Approved"
                };
                var oPayLoadPC = {
                    status_code: "Approved"
                };
                sap.ui.core.BusyIndicator.show();
                const info = await this.updatePricingRecord(oModel, oInput.getBindingContext().sPath, oActionUriParameters);
                if (info.status_code) {
                    MessageBox.success("Record Approved Successfully");
                }
                sap.ui.core.BusyIndicator.hide();

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
            },
            updatePricingRecord: function (oModel, sPath, oPayLoad) {
                return new Promise(function (resolve, reject) {
                    oModel.update(sPath, oPayLoad, {
                        success: function (oData) {
                            this.getView().byId("idSTabPrcingNoti").rebindTable(true);
                            this._oPopover.close();
                            resolve(oData);
                        }.bind(this),
                        error: function (error) {
                            resolve(error);
                        }
                    });
                }.bind(this));
            },
            onPressAccept: function (oEvent) {
                var oModel = this.getOwnerComponent().getModel();
                var oObj = oEvent.getBindingContext().getObject();
                var oPayLoad = {
                    uuid: oObj.uuid,
                    manufacturerCode: oObj.Pricing_Conditions_manufacturerCode,
                    countryCode_code: oObj.Pricing_Conditions_countryCode_code
                };
                sap.ui.core.BusyIndicator.show();

                oModel.callFunction("/acceptPricingCond", {
                    method: "POST",
                    urlParameters: oPayLoad,
                    success: function (oData) {
                        this.getOwnerComponent().getModel().refresh();
                        sap.ui.core.BusyIndicator.hide();
                    }.bind(this),
                    error: function (error) {
                        // debugger;
                        sap.ui.core.BusyIndicator.hide();
                    }
                });
            },
            onPressReject: function (oInput) {
                var oDialogRej = this.createDialog(oInput);
                oDialogRej.open();
            },
            createDialog: function (oInput) {
                var oSelObj = oInput.getBindingContext().getObject();
                if (this.oRejectDialog) {
                    this.oRejectDialog.destroy();
                    this.oRejectDialog = undefined;
                }
                if (!this.oRejectDialog) {
                    this.oRejectDialog = new Dialog({
                        title: "Reject",
                        type: DialogType.Message,
                        content: [
                            new Label({
                                text: "Do you want to reject " + oSelObj.Pricing_Conditions_manufacturerCode + "?",
                                labelFor: "rejectionNote",
                            }),
                            new TextArea("rejectionNote", {
                                width: "100%",
                                placeholder: "Add note (required)",
                                liveChange: function (oEvent) {
                                    var sText = oEvent.getParameter("value");
                                    this.oRejectDialog
                                        .getBeginButton()
                                        .setEnabled(sText.length > 0);
                                }.bind(this),
                            }),
                        ],
                        beginButton: new Button({
                            type: ButtonType.Emphasized,
                            text: "Reject",
                            enabled: false,
                            press: this.onRejOk.bind(this, oInput),
                        }),
                        endButton: new Button({
                            text: "Cancel",
                            press: function () {
                                this.oRejectDialog.close();
                            }.bind(this),
                        }),
                    });
                }
                return this.oRejectDialog;

            },
            onRejOk: async function (oInput) {
                var sText = sap.ui.getCore().byId("rejectionNote").getValue();
                var oModel = this.getOwnerComponent().getModel();
                var logOnUserObj = this.getOwnerComponent().getModel("userModel").getProperty("/role");
                var oSelObj = oInput.getBindingContext().getObject();
                var oActionUriParameters = {
                    pricing_Notif_uuid: oSelObj.uuid,
                    Pricing_Conditions_manufacturerCode: oSelObj.Pricing_Conditions_manufacturerCode,
                    Pricing_Conditions_countryCode_code: oSelObj.Pricing_Conditions_countryCode_code,
                    Comment: sText
                };
                var oPayLoadVL = {
                    status_code: "Rejected"
                };
                sap.ui.core.BusyIndicator.show();
                const info = await this.createPricingComment(oModel, "/PricingComments", oActionUriParameters);
                if (info.status_code) {
                    MessageBox.success("Record Rejected Successfully");
                }
                sap.ui.core.BusyIndicator.hide();
                this.oRejectDialog.close();
            },
            updatePricingRecordData: function (oModel, sPath, oPayLoad) {
                return new Promise(function (resolve, reject) {
                    oModel.update(sPath, oPayLoad, {
                        success: function (oData) {
                            this.getView().byId("idSTabPrcingNoti").rebindTable(true);
                            this._oPopover.close();
                            resolve(oData);
                        }.bind(this),
                        error: function (error) {
                            resolve(error);
                        }
                    });
                }.bind(this));
            },
            createPricingComment: function (oModel, sPath, oPayLoad) {
                return new Promise(function (resolve, reject) {
                    oModel.create(sPath, oPayLoad, {
                        success: function (oData) {
                            this.getView().byId("idSTabPrcingNoti").rebindTable(true);
                            this._oPopover.close();
                            resolve(oData);
                        }.bind(this),
                        error: function (error) {
                            resolve(error);
                        }
                    });
                }.bind(this));
            },
        });
    }
);
