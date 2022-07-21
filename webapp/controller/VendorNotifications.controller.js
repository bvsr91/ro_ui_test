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
        "./modules/utilController",
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
        Device, Fragment, formatter, RowAction, RowActionItem, RowSettings, MessageBox, utilController,
        Dialog, Button, Label, mobileLibrary, MessageToast, Text, TextArea) {
        "use strict";
        // shortcut for sap.m.ButtonType
        var ButtonType = mobileLibrary.ButtonType;
        // shortcut for sap.m.DialogType
        var DialogType = mobileLibrary.DialogType;
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
                this.setSelKey("vendNoti");
                this.getView().byId("idSTabVendorNoti").rebindTable(true);
            },
            onBeforeRebindTable: async function (oEvent) {
                var mBindingParams = oEvent.getParameter("bindingParams"),
                    // oSmtFilter = this.getView().byId("idSTabPrcingNoti"),
                    oModel = this.getOwnerComponent().getModel(),
                    sTabSelKey = this.getView().byId("idIconTabBar").getSelectedKey();
                var oUserModel = this.getOwnerComponent().getModel("userModel");
                var role = oUserModel.getData().role;
                // var aTokens = oObjId.getTokens();
                this._sEntitySet;

                var sFieldName;
                if (!role) {
                    await this.validateUser();
                }

                if (role.role_role) {
                    if (role.role_role === "CDT" || role.role_role === "LDT") {
                        // sFieldName = "createdBy";
                        this.getView().byId("idSTabVendorNoti").setEntitySet("VendorNotifications_U");
                        this._sEntitySet = "VendorNotifications_U";
                    } else {
                        // sFieldName = "approver"
                        this.getView().byId("idSTabVendorNoti").setEntitySet("VendorNotifications_A");
                        this._sEntitySet = "VendorNotifications_A";
                    }
                }
                if (sTabSelKey !== "All" && sTabSelKey !== "") {
                    mBindingParams.filters.push(new Filter("status_code", FilterOperator.EQ, sTabSelKey));
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
                this.getView().byId("idSTabVendorNoti").rebindTable(true);
            },
            extendTable: function () {
                var oTable = this.byId("idUiTabVendorNoti");
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
                var oRecordApprover = oInput.getBindingContext().getObject().approver;
                var logOnUserObj = this.getOwnerComponent().getModel("userModel").getProperty("/role");
                if (logOnUserObj.userid && oRecordApprover.toLowerCase() === logOnUserObj.userid.toLowerCase()) {
                    if (oInput.getBindingContext().getObject().status_code === "Approved") {
                        bEdit = false;
                    } else {
                        bEdit = true;
                    }

                } else {
                    bEdit = false;
                }
                var oActionSheet = new sap.m.ActionSheet({
                    buttons: [
                        new sap.m.Button({
                            text: 'Approve', icon: 'sap-icon://accept', type: 'Transparent', width: '6rem', enabled: bEdit,
                            press: this.onPressApprove.bind(this, oInput)
                        }),
                        new sap.m.Button({
                            text: 'Reject', icon: 'sap-icon://decline', type: 'Transparent', width: '6rem', enabled: bEdit,
                            press: this.onPressReject.bind(this, oInput)
                        }),
                        new sap.m.Button({
                            text: 'History', icon: 'sap-icon://history', type: 'Transparent', width: '6rem',
                            // press: this.onHistoryClick.bind(this, oInput)
                        })
                    ]
                });
                // var oPopover = new sap.m.Popover({
                //     placement: "Auto",
                //     showHeader: false,
                //     content: [
                //         new sap.m.VBox({
                //             items: [
                //                 new sap.m.Button({
                //                     text: 'Approve', icon: 'sap-icon://accept', type: 'Transparent', width: '6rem', enabled: bEdit,
                //                     press: this.onPressApprove.bind(this, oInput)
                //                 }),
                //                 new sap.m.Button({
                //                     text: 'Reject', icon: 'sap-icon://decline', type: 'Transparent', width: '6rem', enabled: bEdit,
                //                     press: this.onPressReject.bind(this, oInput)
                //                 }),
                //                 new sap.m.Button({
                //                     text: 'History', icon: 'sap-icon://history', type: 'Transparent', width: '6rem',
                //                     // press: this.onHistoryClick.bind(this, oInput)
                //                 })
                //             ]
                //         }).addStyleClass("sapUiTinyMargin"),
                //     ],
                // }).addStyleClass("sapUiResponsivePadding");
                // this._oPopover = oPopover;
                oActionSheet.openBy(oInput);
            },
            onPressApprove: async function (oInput) {
                var oModel = this.getOwnerComponent().getModel();
                var logOnUserObj = this.getOwnerComponent().getModel("userModel").getProperty("/role");
                var oSelObj = oInput.getBindingContext().getObject();
                var oActionUriParameters = {
                    uuid: oSelObj.uuid,
                    Vendor_List_manufacturerCode: oSelObj.Vendor_List_manufacturerCode,
                    Vendor_List_countryCode_code: oSelObj.Vendor_List_countryCode_code,
                    Vendor_List_localManufacturerCode: oSelObj.Vendor_List_localManufacturerCode,
                    completionDate: new Date().toISOString(),
                    approvedDate: new Date().toISOString(),
                    approver: logOnUserObj.userid,
                    status_code: "Approved"
                };
                var oPayLoadVL = {
                    status_code: "Approved"
                };
                sap.ui.core.BusyIndicator.show();
                const info = await this.updateVendorRecord(oModel, oInput.getBindingContext().sPath, oActionUriParameters);
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
            updateVendorRecord: function (oModel, sPath, oPayLoad) {
                return new Promise(function (resolve, reject) {
                    oModel.update(sPath, oPayLoad, {
                        success: function (oData) {
                            this.getView().byId("idSTabVendorNoti").rebindTable(true);
                            this._oPopover.close();
                            resolve(oData);
                        }.bind(this),
                        error: function (error) {
                            resolve(error);
                        }
                    });
                }.bind(this));
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
                                text: "Do you want to reject " + oSelObj.Vendor_List_manufacturerCode + "?",
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
                var oSelObj = oInput.getBindingContext().getObject();
                var oActionUriParameters = {
                    vendor_Notif_uuid: oSelObj.uuid,
                    Vendor_List_manufacturerCode: oSelObj.Vendor_List_manufacturerCode,
                    Vendor_List_countryCode_code: oSelObj.Vendor_List_countryCode_code,
                    Vendor_List_localManufacturerCode: oSelObj.Vendor_List_localManufacturerCode,
                    Comment: sText
                };
                var oPayLoadVL = {
                    status_code: "Rejected"
                };
                sap.ui.core.BusyIndicator.show();
                const info = await this.createVendorComment(oModel, "/VendorComments", oActionUriParameters);
                if (info.status_code) {
                    MessageBox.success("Record Rejected Successfully");
                }
                sap.ui.core.BusyIndicator.hide();

                this.oRejectDialog.close();
            },
            createVendorComment: function (oModel, sPath, oPayLoad) {
                return new Promise(function (resolve, reject) {
                    oModel.create(sPath, oPayLoad, {
                        success: function (oData) {
                            this.getView().byId("idSTabVendorNoti").rebindTable(true);
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
