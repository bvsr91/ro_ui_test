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
        "../model/formatter",
        "sap/ui/table/RowAction",
        "sap/ui/table/RowActionItem",
        "sap/ui/table/RowSettings"
    ],
    function (
        BaseController, JSONModel, Filter, Sorter, FilterOperator, GroupHeaderListItem, Device, Fragment, MessageBox, formatter,RowAction,RowActionItem,RowSettings) {
        "use strict";

        return BaseController.extend("com.ferrero.zmrouiapp.controller.PricingCond", {
            formatter: formatter,

            /* =========================================================== */
            /* lifecycle methods                                           */
            /* =========================================================== */

            /**
             * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
             * @public
             */
            onInit: function () {
                this.getRouter().getRoute("pricingCond").attachPatternMatched(this._onRouteMatched, this);
                // this.getRouter().attachBypassed(this.onBypassed, this);
                // var oModel = this.getOwnerComponent().getModel("mrosrv_v2")
                // this.getView().setModel(oModel);
                // this.getView().byId("priceSmartTab").rebindTable();
                this.extendTable();
                var that = this;
                var oHashChanger = new sap.ui.core.routing.HashChanger.getInstance();
                oHashChanger.attachEvent("hashChanged", function (oEvent) {
                    that.routeAuthValidation(oHashChanger.getHash());
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
                this.setSelKey("pricingCond");
                this.routeAuthValidation("pricingCond");
            },
   
            handleAddPricing: function () {
                if (!this._DialogAddPricing) {
                    this._DialogAddPricing = sap.ui.xmlfragment(this.createId("FrgAddPricing"), "com.ferrero.zmrouiapp.view.fragments.AddPricingForm", this);
                    this.getView().addDependent(this._DialogAddPricing);
                }
                this._DialogAddPricing.open();
            },
            onClosePricing: function () {
                if (this._DialogAddPricing) {
                    this._DialogAddPricing.close();
                    this._DialogAddPricing.destroy(true);
                    this._DialogAddPricing = undefined;
                }
            },
            onaddPricingData: function () {
                var manufacturerCode = this.byId(Fragment.createId("FrgAddPricing", "idIpManf")).getValue();
                var manufacturerCodeDesc = this.byId(Fragment.createId("FrgAddPricing", "idIpManfDesc")).getValue();
                var country = this.byId(Fragment.createId("FrgAddPricing", "idIpCountry")).getValue();
                var countryDesc = this.byId(Fragment.createId("FrgAddPricing", "idIpCountryDesc")).getText();
                var countryFact = this.byId(Fragment.createId("FrgAddPricing", "idIpContFact")).getValue();
                var validityStartId = this.byId(Fragment.createId("FrgAddPricing", "validityStartId")).getValue();
                var validityEndId = this.byId(Fragment.createId("FrgAddPricing", "validityEndId")).getValue();
                var exchageRate = this.byId(Fragment.createId("FrgAddPricing", "idIpExchRate")).getValue();
                var bLocalOwnerShip = this.byId(Fragment.createId("FrgAddPricing", "localOwnershipId")).getSelected();
                var oPayLoad = {};
                oPayLoad.manufacturerCode = manufacturerCode === "" ? null : manufacturerCode;
                // oPayLoad.localManufacturerCode = localDealerManufacturerCode;
                oPayLoad.countryCode = country === "" ? null : country;
                oPayLoad.countryDesc = countryDesc;
                oPayLoad.manufacturerCodeDesc = manufacturerCodeDesc;
                oPayLoad.countryFactor = isNaN(parseInt(countryFact)) && countryFact === "" ? 0.0 : parseFloat(countryFact);
                oPayLoad.exchangeRate = isNaN(parseInt(exchageRate)) && exchageRate === "" ? 0.0 : parseFloat(exchageRate);
                oPayLoad.validityStart = validityStartId === "" ? null : new Date(validityStartId).toISOString();
                oPayLoad.validityEnd = validityEndId === "" ? null : new Date(validityEndId).toISOString();
                oPayLoad.local_ownership = bLocalOwnerShip;
                var oModel = this.getOwnerComponent().getModel();
                sap.ui.core.BusyIndicator.show();
                // this.getView().setBusy(true);
                oModel.create("/PricingConditions", oPayLoad, {
                    success: function (oData) {
                        console.log(oData);
                        this.onClosePricing();
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
            onValueHelpRequestCountry: function (oEvent) {
                this.openCountryValueHelpDialog(oEvent);
            },
            _configValueHelpDialog: function () {
                // var sInputValue = this.byId("idIpCountry").getValue();
                // this.byId(sap.ui.core.Fragment.createId("FrgAddVendorData", "idIpCountry")).getValue();
            },

            onValueHelpDialogClose: function (oEvent) {
                this.countryValueHelpClose(oEvent, "FrgAddPricing", "idIpCountry", "idIpCountryDesc")
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
            },

            extendTable: function () {
                var oTable = this.byId("idPricingCondTab");
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
                                    press: this.onEditPricingForm.bind(this, oInput)
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

            onEditPricingForm: function (oInput) {
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
                    this._oDialog = sap.ui.xmlfragment(this.createId("FrgPricingData"), "com.ferrero.zmrouiapp.view.fragments.PricingConditionForm", this);
                    this.getView().addDependent(this._oDialog);
                }
                this.byId(sap.ui.core.Fragment.createId("FrgPricingData", "SimpleFormToolbarPricingDisplay"))
                    .bindElement({
                        path: sPath,
                    });
             this._oDialog.open();
            },
            onClosePricingData: function () {
                if (this._oDialog) {
                    this._oDialog.close();
                    this._oDialog.destroy();
                    this._oDialog = undefined;
                }
            },
            onSavePricingData : function (oInput) {
                var oModel = this.getOwnerComponent().getModel();
                var sPath = oInput.getSource().getParent().getParent().getController()._editObjContext.sPath;
                var manufacturerDesc = this.byId(Fragment.createId("FrgPricingData", "idIpManfDesc")).getValue();
                var exchageRate = this.byId(Fragment.createId("FrgPricingData", "idExchRate")).getValue();
                var countryFactor = this.byId(Fragment.createId("FrgPricingData", "idContFactor")).getValue();
                var validityStartId = this.byId(Fragment.createId("FrgPricingData", "validityStartId")).getValue();
                var validityEndId = this.byId(Fragment.createId("FrgPricingData", "validityEndId")).getValue();
                var bLocalOwnerShip = this.byId(Fragment.createId("FrgPricingData", "localOwnershipId")).getSelected();                
                var oPayLoad = {};
                oPayLoad.manufacturerCodeDesc = manufacturerDesc;
                oPayLoad.countryFactor = isNaN(parseInt(countryFactor)) && countryFactor === "" ? 0.0 : parseFloat(countryFactor);
                oPayLoad.exchangeRate = isNaN(parseInt(exchageRate)) && exchageRate === "" ? 0.0 : parseFloat(exchageRate);
                oPayLoad.validityStart = validityStartId === "" ? null : new Date(validityStartId).toISOString();
                oPayLoad.validityEnd = validityEndId === "" ? null : new Date(validityEndId).toISOString();
                oPayLoad.local_ownership = bLocalOwnerShip;
                var oModel = this.getOwnerComponent().getModel();
                // this.getView().setBusy(true);
                sap.ui.core.BusyIndicator.show();
                oModel.update(sPath, oPayLoad, {
                    success: function (oData) {
                        console.log(oData);
                        this.onClosePricingData();
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

            }
        
        });
    }
);
