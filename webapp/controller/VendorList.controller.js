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
        "sap/m/MessageBox",
        "sap/ui/table/RowAction",
        "sap/ui/table/RowActionItem",
        "sap/ui/table/RowSettings",
        "../model/formatter",
    ],
    function (
        BaseController, JSONModel, Filter, Sorter, FilterOperator, GroupHeaderListItem, Device, Fragment, MessageBox, RowAction, RowActionItem, RowSettings, formatter) {
        "use strict";

        return BaseController.extend("com.ferrero.zmrouiapp.controller.VendorList", {
            formatter: formatter,

            /* =========================================================== */
            /* lifecycle methods                                           */
            /* =========================================================== */

            /**
             * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
             * @public
             */
            onInit: function () {
                this.getRouter()
                    .getRoute("vendorList")
                    .attachPatternMatched(this._onRouteMatched, this);
                // this.getRouter().attachBypassed(this.onBypassed, this);
                // var oModel = this.getOwnerComponent().getModel("mrosrv_v2")
                // this.getView().setModel(oModel);
                // this.getView().byId("vendSmartTab").rebindTable();
                // this.createRecord();
                this.extendTable();
                var that = this;
                var oHashChanger = new sap.ui.core.routing.HashChanger.getInstance();
                oHashChanger.attachEvent("hashChanged", function (oEvent) {
                    that.routeAuthValidation(oHashChanger.getHash());
                });
            },
            createRecord: function () {
                var oPayLoad = {};
                // oPayLoad.uuid_manufacturerCode = "55515";
                oPayLoad.uuid = "5";
                // oPayLoad.uuid_countryCode = "AE";
                oPayLoad.comment = "SRini";
                var oModel = this.getOwnerComponent().getModel();
                // this.getView().setBusy(true);
                sap.ui.core.BusyIndicator.show();
                oModel.create("/VendorComments", oPayLoad, {
                    success: function (oData) {
                        console.log(oData);
                        this.onCloseVendor();
                        // this.getView().setBusy(false);
                        sap.ui.core.BusyIndicator.hide();
                        MessageBox.success("Record created successfully");
                    }.bind(this),
                    error: function (error) {
                        console.log(error);
                        sap.ui.core.BusyIndicator.hide();
                        var errorObj1 = JSON.parse(error.responseText).error.message;
                        MessageBox.show(
                            errorObj1.value,
                            sap.m.MessageBox.Icon.ERROR,
                            "Error In Create Operation"
                        );
                        // this.getView().setBusy(false);
                    }.bind(this)
                });
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
                this.setSelKey("vendorList");
                this.routeAuthValidation("vendorList");
            },

            handleAddVendor: function () {
                if (!this._DialogAddVendor) {
                    this._DialogAddVendor = sap.ui.xmlfragment(this.createId("FrgAddVendorData"), "com.ferrero.zmrouiapp.view.fragments.AddVendorForm", this);
                    this.getView().addDependent(this._DialogAddVendor);
                }
                this._DialogAddVendor.open();
            },
            onCloseVendor: function () {
                if (this._DialogAddVendor) {
                    this._DialogAddVendor.close();
                    this._DialogAddVendor.destroy(true);
                    this._DialogAddVendor = undefined;
                }
            },
            onSaveNewVendorData: function () {
                var manufacturerCode = this.byId(Fragment.createId("FrgAddVendorData", "idIpManf")).getValue();
                var manufacturerDesc = this.byId(Fragment.createId("FrgAddVendorData", "idIpManfDesc")).getValue();
                var localDealerManufacturerCode = this.byId(Fragment.createId("FrgAddVendorData", "idIpLocalManf")).getValue();
                var localDealerMaufacturerDesc = this.byId(Fragment.createId("FrgAddVendorData", "idIpLocalManfDesc")).getValue();
                var country = this.byId(Fragment.createId("FrgAddVendorData", "idIpCountry")).getValue();
                var countryDesc = this.byId(Fragment.createId("FrgAddVendorData", "idIpCountryDesc")).getText();

                var oPayLoad = {};
                oPayLoad.manufacturerCode = manufacturerCode === "" ? null : manufacturerCode;
                oPayLoad.localManufacturerCode = localDealerManufacturerCode === "" ? null : localDealerManufacturerCode;
                oPayLoad.countryCode = country === "" ? null : country;
                oPayLoad.countryDesc = countryDesc;
                oPayLoad.manufacturerCodeDesc = manufacturerDesc;
                oPayLoad.localManufacturerCodeDesc = localDealerMaufacturerDesc;

                var oModel = this.getOwnerComponent().getModel();
                // this.getView().setBusy(true);
                sap.ui.core.BusyIndicator.show();
                oModel.create("/VendorList", oPayLoad, {
                    success: function (oData) {
                        console.log(oData);
                        this.onCloseVendor();
                        // this.getView().setBusy(false);
                        sap.ui.core.BusyIndicator.hide();
                        MessageBox.success("Record created successfully");
                    }.bind(this),
                    error: function (error) {
                        console.log(error);
                        sap.ui.core.BusyIndicator.hide();
                        var errorObj1 = JSON.parse(error.responseText).error.message;
                        MessageBox.show(
                            errorObj1.value,
                            sap.m.MessageBox.Icon.ERROR,
                            "Error In Create Operation"
                        );
                        // this.getView().setBusy(false);
                    }.bind(this)
                });
            },
            extendTable: function () {
                var oTable = this.byId("idUiTab");
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
                                    // new RowActionItem({ icon: "sap-icon://attachment", text: "Attachment", press: fnPress }),
                                     new RowActionItem({ icon: "sap-icon://action", text: "Action", press: fnPress }),
                                    // new RowActionItem({ icon: "sap-icon://edit", text: "Edit", press: fnPress }),
                                    // new RowActionItem({ text: "Delete", press: fnPress, type: sap.ui.table.RowActionType.Delete })
                                ]
                            });
                            return [2, oTemplate];
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
                this.onLinksDownload(oEvent);
                // var oRecordCreator = oEvent.getParameter("row").getBindingContext().getObject().initiator;
                // var logOnUserObj = this.getOwnerComponent().getModel("userModel").getProperty("/role");
                // if (logOnUserObj.userid && oRecordCreator.toLowerCase() === logOnUserObj.userid.toLowerCase()) {
                //     var oRow = oEvent.getParameter("row");
                //     var oItem = oEvent.getParameter("item");
                //     if (oItem.getType() === "Delete") {
                //         this.onDeleteAwaitConfirm(oEvent);
                //     } else {
                //         this.onEditVendorForm(oEvent);
                //     }
                // } else {
                //     MessageBox.error("You can not edit/delete the record that was created by others");
                // }
                // // sap.m.MessageToast.show("Item " + (oItem.getText() || oItem.getType()) + " pressed for product with id " +
                // //     oRow.getBindingContext().getObject().manufacturerCode);
            },
            onLinksDownload: function (oEvent) {
                var oInput = oEvent.getSource().getParent();
                //   bEnDevelopment = oBinding.MyDevelopment === "X",
                var oPopover = new sap.m.Popover({
                    placement: "Bottom",
                    showHeader: false,
                    content: [
                        new sap.m.VBox({
                            items: [
                                new sap.m.Button({
                                    text: 'Edit', icon: 'sap-icon://edit', type: 'Transparent', width: '6rem',
                                    press: this.onEditVendorForm.bind(this, oInput)
                                }),
                                new sap.m.Button({
                                    text: 'Delete', icon: 'sap-icon://delete', type: 'Transparent', width: '6rem',
                                    press: this.onDeleteAwaitConfirm.bind(this, oInput)
                                }),
                                new sap.m.Button({
                                    text: 'History', icon: 'sap-icon://history', type: 'Transparent', width: '6rem',
                                    press: this.onHistoryClick.bind(this, oInput)
                                })
                            ]
                        }).addStyleClass("sapUiTinyMargin"),
                    ],
                }).addStyleClass("sapUiResponsivePadding");
                oPopover.openBy(oInput);
            },
            onEditVendorForm: function (oInput) {
                var oRecordCreator = oInput.getBindingContext().getObject().initiator;
                var logOnUserObj = this.getOwnerComponent().getModel("userModel").getProperty("/role");
                if (logOnUserObj.userid && oRecordCreator.toLowerCase() === logOnUserObj.userid.toLowerCase()) {
                    this._editObjContext = oInput.getBindingContext();
                    this.open_Dialog(this._editObjContext);
                } else {
                    MessageBox.error("You can not edit/delete the record that was created by others");
                }
            },
            open_Dialog: function (editObj) {
                var oCtx = editObj.getObject();
                var sPath = editObj.getPath();
                if (!this._oDialog) {
                    this._oDialog = sap.ui.xmlfragment(this.createId("FrgVendorData"), "com.ferrero.zmrouiapp.view.fragments.VendorForm", this);
                    this.getView().addDependent(this._oDialog);
                }
                this.byId(
                    sap.ui.core.Fragment.createId("FrgVendorData", "SimpleFormToolbarDisplay")).bindElement({
                        path: sPath,
                    });
             this._oDialog.open();
            },
            onCloseVendorData: function () {
                if (this._oDialog) {
                    this._oDialog.close();
                    this._oDialog.destroy();
                    this._oDialog = undefined;
                }
            },
            onSaveVendorData : function (oInput) {
                var oModel = this.getOwnerComponent().getModel();
                var sPath = oInput.getSource().getParent().getParent().getController()._editObjContext.sPath;
                var manufacturerDesc = this.byId(Fragment.createId("FrgVendorData", "ManfDescId")).getValue();
                var localDealerMaufacturerDesc = this.byId(Fragment.createId("FrgVendorData", "localManufDescID")).getValue();
                var oPayLoad = {};
                oPayLoad.manufacturerCodeDesc = manufacturerDesc;
                oPayLoad.localManufacturerCodeDesc = localDealerMaufacturerDesc;
                var oModel = this.getOwnerComponent().getModel();
                // this.getView().setBusy(true);
                sap.ui.core.BusyIndicator.show();
                oModel.update(sPath, oPayLoad, {
                    success: function (oData) {
                        console.log(oData);
                        this.onCloseVendorData();
                        // this.getView().setBusy(false);
                        sap.ui.core.BusyIndicator.hide();
                        MessageBox.success("Record updated successfully");
                    }.bind(this),
                    error: function (error) {
                        console.log(error);
                        sap.ui.core.BusyIndicator.hide();
                        var errorObj1 = JSON.parse(error.responseText).error.message;
                        MessageBox.show(
                            errorObj1.value,
                            sap.m.MessageBox.Icon.ERROR,
                            "Error In Update Operation"
                        );
                        // this.getView().setBusy(false);
                    }.bind(this)
                });
            },       
            onDeleteAwaitConfirm: function (oInput) {
                var oRecordCreator = oInput.getBindingContext().getObject().initiator;
                var logOnUserObj = this.getOwnerComponent().getModel("userModel").getProperty("/role");
                if (logOnUserObj.userid && oRecordCreator.toLowerCase() === logOnUserObj.userid.toLowerCase()) {
                    this._oDelObjContext = oInput.getBindingContext();
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
                } else {
                    MessageBox.error("You can not edit/delete the record that was created by others");
                }
                            
            },
            onConfirmDelete: function (oContext) {
                var oModel = this.getOwnerComponent().getModel();

                var oPayLoad = {};
                oPayLoad.status_code = "Deleted";
                sap.ui.core.BusyIndicator.show();
                oModel.update(oContext.sPath, oPayLoad, {
                    success: function (oData) {
                        sap.ui.core.BusyIndicator.hide();
                        MessageBox.success("Record Deleted successfully");
                    }.bind(this),
                    error: function (error) {
                        sap.ui.core.BusyIndicator.hide();
                        var errorObj1 = JSON.parse(error.responseText).error.message;
                        MessageBox.show(
                            errorObj1.value,
                            sap.m.MessageBox.Icon.ERROR,
                            "Error In Delete Operation"
                        );
                    }.bind(this)
                });
            },
            onHistoryClick: function (oInput) {
                var sPath=oInput.getBindingContext().getPath;
                if (!this._oDialog) {
                    this._oDialog = sap.ui.xmlfragment(this.createId("FrgVendorComments"), "com.ferrero.zmrouiapp.view.fragments.VendorCommentsData", this);
                    this.getView().addDependent(this._oDialog);
                }
                // this.byId(
                //     sap.ui.core.Fragment.createId("FrgVendorComments", "commentsList")).bindElement({
                //         path: sPath,
                //     });
                this._oDialog.open();
            },
            onCloseCommentsData: function () {
                if (this._oDialog) {
                    this._oDialog.close();
                    this._oDialog.destroy();
                    this._oDialog = undefined;
                }

            },
            onValueHelpRequestCountry: function (oEvent) {
                this.openCountryValueHelpDialog(oEvent);
            },
            _configValueHelpDialog: function () {
                // var sInputValue = this.byId("idIpCountry").getValue();
                // this.byId(sap.ui.core.Fragment.createId("FrgAddVendorData", "idIpCountry")).getValue();
            },

            onValueHelpDialogClose: function (oEvent) {
                this.countryValueHelpClose(oEvent, "FrgAddVendorData", "idIpCountry", "idIpCountryDesc")
            },
            onSearch: function (oEvent) {
                var sValue = oEvent.getParameter("value");
                // var oFilter = new Filter("desc", FilterOperator.Contains, sValue, true);
                var aFilters = [];
                aFilters.push(this.createFilter("desc", FilterOperator.Contains, sValue, true));

                var oBinding = oEvent.getParameter("itemsBinding");
                oBinding.filter(aFilters);
            },
            createFilter: function (key, operator, value, useToLower) {
                return new Filter(useToLower ? "tolower(" + key + ")" : key, operator, useToLower ? "'" + value.toLowerCase() + "'" : value);
            }
        });
    }
);
