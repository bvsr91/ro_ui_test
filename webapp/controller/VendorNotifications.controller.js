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
                var oMessageManager = sap.ui.getCore().getMessageManager();
                this.getView().setModel(oMessageManager.getMessageModel(), "message");
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
                sap.ui.getCore().getMessageManager().removeAllMessages();
                this.setSelKey("vendNoti");
                this.getView().byId("idSTabVendorNoti").rebindTable(true);
            },
            onMessagePopoverPress: function (oEvent) {
                var oSourceControl = oEvent.getSource();
                this._getMessagePopover().then(function (oMessagePopover) {
                    oMessagePopover.openBy(oSourceControl);
                });
            },

            _getMessagePopover: function () {
                var oView = this.getView();

                // create popover lazily (singleton)
                if (!this._pMessagePopover) {
                    this._pMessagePopover = Fragment.load({
                        id: oView.getId(),
                        name: "com.ferrero.zmrouiapp.view.fragments.MessagePopover"
                    }).then(function (oMessagePopover) {
                        oView.addDependent(oMessagePopover);
                        return oMessagePopover;
                    });
                }
                return this._pMessagePopover;
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
                    this.getUserDetails().then();
                    await this.validateUser();
                }

                if (role.role_role) {
                    if (role.role_role === "CDT") {
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
                var bEdit = false, bDelete = false, bReopen = false;
                var oSelObj = oInput.getBindingContext().getObject();
                var oRecordCreator = oInput.getBindingContext().getObject().createdBy;
                var oRecordApprover = oInput.getBindingContext().getObject().approver;
                var logOnUserObj = this.getOwnerComponent().getModel("userModel").getProperty("/role");
                if (logOnUserObj.userid && oRecordApprover.toLowerCase() === logOnUserObj.userid.toLowerCase() && (logOnUserObj.role_role === "GCM" ||
                    logOnUserObj.role_role === "SGC")) {
                    if (oInput.getBindingContext().getObject().status_code === "Approved" ||
                        oInput.getBindingContext().getObject().status_code === "Rejected") {
                        bEdit = false;
                    } else {
                        bEdit = true;
                    }

                } else {
                    bEdit = false;
                }
                if (oSelObj.status_code === "Approved" && oSelObj.approver === logOnUserObj.userid.toUpperCase()) {
                    bReopen = true;
                }
                var oActionSheet = new sap.m.ActionSheet({
                    placement: "VerticalPreferredBottom",
                    buttons: [
                        new sap.m.Button({
                            text: 'Approve', type: 'Transparent', width: '6rem', enabled: bEdit,
                            press: this.onPressApprove.bind(this, oInput)
                        }),
                        new sap.m.Button({
                            text: 'Reject', type: 'Transparent', width: '6rem', enabled: bEdit,
                            press: this.onPressReject.bind(this, oInput)
                        }),
                        new sap.m.Button({
                            text: 'Re-Open', type: 'Transparent', width: '6rem', visible: bReopen,
                            press: this.onPressReopen.bind(this, oInput)
                        }),
                        new sap.m.Button({
                            text: 'History', type: 'Transparent', width: '6rem',
                            press: this.onHistoryClick.bind(this, oInput)
                        })
                    ]
                });
                oActionSheet.openBy(oInput);
            },
            onHistoryClick: async function (oInput) {
                var sPath = oInput.getBindingContext().getPath;
                var oSelObj = oInput.getBindingContext().getObject();
                var oModel = this.getOwnerComponent().getModel();
                // const info = await $.get(oModel.sServiceUrl + '/VendorComments?');
                if (!this._oDialog) {
                    this._oDialog = sap.ui.xmlfragment(this.createId("FrgVendorComments"), "com.ferrero.zmrouiapp.view.fragments.VendorHistory", this);
                    this.getView().addDependent(this._oDialog);
                }
                var oList = this.byId(Fragment.createId("FrgVendorComments", "idListVendComment"));
                var aFilter = [];
                aFilter.push(new Filter("Vendor_List_manufacturerCode", FilterOperator.EQ, oSelObj.Vendor_List_manufacturerCode, true));
                aFilter.push(new Filter("Vendor_List_uuid", FilterOperator.EQ, oSelObj.Vendor_List_uuid, true));
                aFilter.push(new Filter("Vendor_List_countryCode_code", FilterOperator.EQ, oSelObj.Vendor_List_countryCode_code, true));
                oList.getBinding("items").filter(aFilter);
                this._oDialog.open();
            },
            onCloseCommentsData: function () {
                if (this._oDialog) {
                    this._oDialog.close();
                    this._oDialog.destroy();
                    this._oDialog = undefined;
                }

            },
            onPressApprove: async function (oInput) {
                sap.ui.getCore().getMessageManager().removeAllMessages();
                var oModel = this.getOwnerComponent().getModel();
                var logOnUserObj = this.getOwnerComponent().getModel("userModel").getProperty("/role");
                var oSelObj = oInput.getBindingContext().getObject();
                var oActionUriParameters = {
                    uuid: oSelObj.uuid,
                    Vendor_List_manufacturerCode: oSelObj.Vendor_List_manufacturerCode,
                    Vendor_List_countryCode_code: oSelObj.Vendor_List_countryCode_code,
                    Vendor_List_uuid: oSelObj.Vendor_List_uuid,
                    localManufacturerCode: oSelObj.localManufacturerCode,
                    completionDate: new Date().toISOString(),
                    approvedDate: new Date().toISOString(),
                    approver: logOnUserObj.userid,
                    status_code: "Approved"
                };
                var oPayLoadVL = {
                    status_code: "Approved"
                };
                var sPath = "/VendorNotifications(guid'" + oSelObj.uuid + "')";
                sap.ui.core.BusyIndicator.show();
                const info = await this.updateVendorRecord(oModel, sPath, oActionUriParameters);
                if (info.status_code) {
                    MessageBox.success("Record Approved Successfully");
                } else {
                    this.errorHandling(info);
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
                sap.ui.getCore().getMessageManager().removeAllMessages();
                return new Promise(function (resolve, reject) {
                    oModel.update(sPath, oPayLoad, {
                        success: function (oData) {
                            this.getView().byId("idSTabVendorNoti").rebindTable(true);
                            this.getOwnerComponent().getModel().refresh();
                            // this._oPopover.close();
                            resolve(oData);
                        }.bind(this),
                        error: function (error) {
                            this.getOwnerComponent().getModel().refresh();
                            resolve(error);
                        }.bind(this)
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
                sap.ui.getCore().getMessageManager().removeAllMessages();
                var sText = sap.ui.getCore().byId("rejectionNote").getValue();
                var oModel = this.getOwnerComponent().getModel();
                var oSelObj = oInput.getBindingContext().getObject();
                var oActionUriParameters = {
                    vendor_Notif_uuid: oSelObj.uuid,
                    Vendor_List_manufacturerCode: oSelObj.Vendor_List_manufacturerCode,
                    Vendor_List_countryCode_code: oSelObj.Vendor_List_countryCode_code,
                    Vendor_List_uuid: oSelObj.Vendor_List_uuid,
                    localManufacturerCode: oSelObj.localManufacturerCode,
                    Comment: sText
                };
                var oPayLoadVL = {
                    status_code: "Rejected"
                };
                sap.ui.core.BusyIndicator.show();
                const info = await this.createVendorComment(oModel, "/VendorComments", oActionUriParameters);
                if (info.vendor_Notif_uuid) {
                    MessageBox.success("Record Rejected Successfully");
                } else {
                    this.errorHandling(info);
                }
                sap.ui.core.BusyIndicator.hide();

                this.oRejectDialog.close();
            },
            createVendorComment: function (oModel, sPath, oPayLoad) {
                sap.ui.getCore().getMessageManager().removeAllMessages();
                return new Promise(function (resolve, reject) {
                    oModel.create(sPath, oPayLoad, {
                        success: function (oData) {
                            this.getView().byId("idSTabVendorNoti").rebindTable(true);
                            this.getOwnerComponent().getModel().refresh();
                            // this._oPopover.close();
                            resolve(oData);
                        }.bind(this),
                        error: function (error) {
                            this.getOwnerComponent().getModel().refresh();
                            resolve(error);
                        }.bind(this)
                    });
                }.bind(this));
            },
            onRowlSelChange: function (oEvent) {
                // var oSelObj = oEvent.getParameter("rowContext").getObject();
                var oRole = this.getOwnerComponent().getModel("userModel").getProperty("/role");
                // var iIndex = oEvent.getParameter("rowIndex");
                if (oEvent.getParameters().selectAll) {
                    var aSelectedIndices = oEvent.getSource().getSelectedIndices();
                    for (var a = 0; a < aSelectedIndices.length; a++) {
                        if (oEvent.getSource().getContextByIndex(a).getObject()) {
                            var oRowObj = oEvent.getSource().getContextByIndex(a).getObject();
                            if (oRowObj.approver !== oRole.userid || oRowObj.status_code !== "Pending") {
                                oEvent.getSource().removeSelectionInterval(a, a);
                            }
                        }
                    }
                } else {
                    var aSelectedIndices = oEvent.getSource().getSelectedIndices();
                    for (var a of aSelectedIndices) {
                        if (oEvent.getSource().getContextByIndex(a).getObject()) {
                            var oRowObj = oEvent.getSource().getContextByIndex(a).getObject();
                            if (oRowObj.approver !== oRole.userid || oRowObj.status_code !== "Pending") {
                                oEvent.getSource().removeSelectionInterval(a, a);
                            }
                        }
                    }
                    // if (oSelObj.approver !== oRole.userid || oSelObj.status_code !== "Pending") {
                    //     // var iIndex = oEvent.getSource().getSelectedIndices().indexOf(oEvent.getSource().getSelectedIndex());
                    //     // oEvent.getSource().getSelectedIndices().splice(iIndex, 1);
                    //     oEvent.getSource().removeSelectionInterval(iIndex, iIndex);
                    // }
                }
            },
            handleApprove: function (oEvent) {
                var oTable = this.getView().byId("idUiTabVendorNoti"),
                    aSelectedIndices = oTable.getSelectedIndices(),
                    aRows = oTable.getRows(),
                    aPayLoad = [];
                if (aSelectedIndices.length > 0) {
                    for (var a of aSelectedIndices) {
                        aPayLoad.push(oTable.getContextByIndex(a).getObject());
                    }
                    this.batchUpdateRecords(aPayLoad, oTable);
                } else {
                    MessageBox.warning("Please select atleast one Row");
                    return;
                }
            },
            batchUpdateRecords: function (aData, oTable) {
                sap.ui.getCore().getMessageManager().removeAllMessages();
                var oModel = this.getOwnerComponent().getModel();
                var logOnUserObj = this.getOwnerComponent().getModel("userModel").getProperty("/role");
                sap.ui.core.BusyIndicator.show();
                var that = this,
                    iCounter = 1,
                    oContext = {
                        update: []
                    };
                oModel.setUseBatch(false);
                var selectedValues = oTable.getSelectedIndices();
                for (var a = 0; a < aData.length; a++) {
                    var oActionUriParameters = {
                        uuid: aData[a].uuid,
                        Vendor_List_manufacturerCode: aData[a].Vendor_List_manufacturerCode,
                        Vendor_List_countryCode_code: aData[a].Vendor_List_countryCode_code,
                        Vendor_List_uuid: aData[a].Vendor_List_uuid,
                        localManufacturerCode: aData[a].localManufacturerCode,
                        completionDate: new Date().toISOString(),
                        approvedDate: new Date().toISOString(),
                        approver: logOnUserObj.userid,
                        status_code: "Approved"
                    };

                    oContext.update.push({
                        "entityName": "/VendorNotifications(guid'" + aData[a].uuid + "')", "payload": oActionUriParameters, "iSelIndex": selectedValues[a] + 1
                    });
                }
                this.onPromiseAll(oContext.update, 'update', "Approve", "VendorNotifications").then((oResponse) => {
                    that.getView().byId("idUiTabVendorNoti").setBusy(false);
                    if (iCounter === 1) {
                        that.getOwnerComponent().getModel().refresh();
                        iCounter += 1;
                    }
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.success("Record Approved Successfully");
                    oTable.clearSelection();


                }).catch((error) => {
                    that.getView().byId("idUiTabVendorNoti").setBusy(false);
                    that.getOwnerComponent().getModel().refresh();
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.error("Error While Approving All/Partial Requests");
                    oTable.clearSelection();
                });
            },
            handleReject: function () {
                // var oSelObj = oInput.getBindingContext().getObject();
                var oTable = this.getView().byId("idUiTabVendorNoti"),
                    aSelectedIndices = oTable.getSelectedIndices(),
                    aRows = oTable.getRows(),
                    aPayLoad = [];
                if (aSelectedIndices.length > 0) {
                    for (var a of aSelectedIndices) {
                        aPayLoad.push(oTable.getContextByIndex(a).getObject());
                    }
                    // this.batchUpdateRecords(aPayLoad);
                } else {
                    MessageBox.warning("Please select atleast one Row");
                    return;
                }

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
                                text: "Do you want to reject ?",
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
                            press: this.onBatchRejOk.bind(this, aPayLoad, oTable),
                        }),
                        endButton: new Button({
                            text: "Cancel",
                            press: function () {
                                this.oRejectDialog.close();
                            }.bind(this),
                        }),
                    });
                }
                this.oRejectDialog.open();
            },
            onBatchRejOk: function (aData, oTable) {
                sap.ui.getCore().getMessageManager().removeAllMessages();
                var sText = sap.ui.getCore().byId("rejectionNote").getValue();
                var oModel = this.getOwnerComponent().getModel();
                var logOnUserObj = this.getOwnerComponent().getModel("userModel").getProperty("/role");
                var that = this,
                    iCounter = 1;
                sap.ui.core.BusyIndicator.show();
                var oContext = {
                    update: []
                };
                oModel.setUseBatch(false);
                var selectedValues = oTable.getSelectedIndices();
                for (var a = 0; a < aData.length; a++) {
                    var oActionUriParameters = {
                        vendor_Notif_uuid: aData[a].uuid,
                        Vendor_List_manufacturerCode: aData[a].Vendor_List_manufacturerCode,
                        Vendor_List_countryCode_code: aData[a].Vendor_List_countryCode_code,
                        Vendor_List_uuid: aData[a].Vendor_List_uuid,
                        localManufacturerCode: aData[a].localManufacturerCode,
                        Comment: sText
                    };
                    oContext.update.push({
                        "entityName": "/VendorComments", "payload": oActionUriParameters, "iSelIndex": selectedValues[a] + 1
                    });
                }
                // this.myPromiseRejectionAll(oContext.update).then((oResponse) => {
                this.onPromiseAll(oContext.update, 'create', "Reject", "VendorComments").then((oResponse) => {
                    that.getView().byId("idUiTabVendorNoti").setBusy(false);
                    if (iCounter === 1) {
                        that.getOwnerComponent().getModel().refresh();
                        iCounter += 1;
                    }
                    that.oRejectDialog.close();
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.success("Record Rejected Successfully");
                    oTable.clearSelection();


                }).catch((error) => {
                    that.getView().byId("idUiTabVendorNoti").setBusy(false);
                    that.getOwnerComponent().getModel().refresh();
                    that.oRejectDialog.close();
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.error("Error While Rejecting All/Partial Requests");
                    oTable.clearSelection();

                })
            },
            onPressReopen: function (oInput) {
                var sPath = oInput.getBindingContext().getPath;
                var oSelObj = oInput.getBindingContext().getObject();
                var oModel = this.getOwnerComponent().getModel();
                if (this._oReopenDialog) {
                    this._oReopenDialog.destroy(true);
                    this._oReopenDialog = null;
                }
                if (!this._oReopenDialog) {
                    this._oReopenDialog = sap.ui.xmlfragment(this.createId("FrgReopen"), "com.ferrero.zmrouiapp.view.fragments.Reopen", this);
                    this.getView().addDependent(this._oReopenDialog);
                }
                // var oList = this.byId(Fragment.createId("FrgVendorComments", "idTxtReopen"));
                this.byId(Fragment.createId("FrgReopen", "idTxtReopen")).setText(oSelObj.uuid);
                this._oReopenDialog.open();
            },
            onPressReopenSave: function (oEvent) {
                var iSelIndex = this.byId(Fragment.createId("FrgReopen", "idRgb")).getSelectedIndex(),
                    uuid = this.byId(Fragment.createId("FrgReopen", "idTxtReopen")).getText();
                sap.ui.getCore().getMessageManager().removeAllMessages();
                var oModel = this.getOwnerComponent().getModel();
                var oPayLoad = {
                    notif_uuid: uuid,
                    status: iSelIndex === 0 ? "Pending" : "Deleted"
                };
                sap.ui.core.BusyIndicator.show();

                oModel.callFunction("/reopenVendor", {
                    method: "POST",
                    urlParameters: oPayLoad,
                    success: function (oData) {
                        this.getOwnerComponent().getModel().refresh();
                        sap.ui.core.BusyIndicator.hide();
                        this.onPressCanelReopen();
                        MessageBox.success("Record Updated Successfully");
                    }.bind(this),
                    error: function (error) {
                        this.getOwnerComponent().getModel().refresh();
                        sap.ui.core.BusyIndicator.hide();
                        this.errorHandling(error);
                    }.bind(this)
                });
            },
            onPressCanelReopen: function (oEvent) {
                if (this._oReopenDialog) {
                    this._oReopenDialog.destroy(true);
                    this._oReopenDialog = null;
                }
            }
        });
    }
);
