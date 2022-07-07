sap.ui.define(
    ["sap/ui/core/mvc/Controller", "sap/ui/core/routing/History",
        "sap/ui/core/Fragment"],
    function (Controller, History, Fragment) {
        "use strict";

        return Controller.extend("com.ferrero.zmrouiapp.controller.BaseController", {
            /**
             * Convenience method for accessing the router in every controller of the application.
             * @public
             * @returns {sap.ui.core.routing.Router} the router for this component
             */
            getRouter: function () {
                return this.getOwnerComponent().getRouter();
            },

            /**
             * Convenience method for getting the view model by name in every controller of the application.
             * @public
             * @param {string} sName the model name
             * @returns {sap.ui.model.Model} the model instance
             */
            getModel: function (sName) {
                return this.getView().getModel(sName);
            },

            /**
             * Convenience method for setting the view model in every controller of the application.
             * @public
             * @param {sap.ui.model.Model} oModel the model instance
             * @param {string} sName the model name
             * @returns {sap.ui.mvc.View} the view instance
             */
            setModel: function (oModel, sName) {
                return this.getView().setModel(oModel, sName);
            },

            /**
             * Convenience method for getting the resource bundle.
             * @public
             * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
             */
            getResourceBundle: function () {
                return this.getOwnerComponent().getModel("i18n").getResourceBundle();
            },

            /**
             * Event handler for navigating back.
             * It there is a history entry we go one step back in the browser history
             * If not, it will replace the current entry of the browser history with the master route.
             * @public
             */
            onNavBack: function () {
                var sPreviousHash = History.getInstance().getPreviousHash();

                if (sPreviousHash !== undefined) {
                    // eslint-disable-next-line sap-no-history-manipulation
                    history.go(-1);
                } else {
                    this.getRouter().navTo("master", {}, true);
                }
            },
            toolPageExpanded: function (bVal) {
                this.getOwnerComponent().getModel("userModel").setProperty("/isExpanded", bVal);
            },
            determineVisibilityBasedOnRole: function () {
                var oVisibleModel = this.getOwnerComponent().getModel("userModel");
                var oVisibleData = oVisibleModel.getData();
                var bCudVisible = false,
                    sRoleName;
                if (oVisibleData.role === "GCM") {
                    // Global catalog manager
                    bCudVisible = false;
                    sRoleName = "Global Catalog Manager";
                } else if (oVisibleData.role === "CDT") {
                    //Central Delivery Team
                    bCudVisible = true;
                    sRoleName = "Central Delivery Team";
                } else if (oVisibleData.role === "LPT") {
                    //Local Procurement Team
                    bCudVisible = false;
                    sRoleName = "Local Procurement Team";
                } else if (oVisibleData.role === "LDT") {
                    // Local Delivery Team
                    bCudVisible = true;
                    sRoleName = "Local Delivery Team";
                }
                oVisibleModel.setProperty("/cudVisible", bCudVisible);
                oVisibleModel.setProperty("/roleName", sRoleName);
            },
            setSelKey: function (sKey) {
                //   sap.ui.getCore().byId("idSN").setSelectedKey(sKey);
                this.getOwnerComponent()
                    .getModel("userModel")
                    .setProperty("/selectedKey", sKey);
                // var aData = this.getOwnerComponent().getModel("userModel").getProperty("/navigation");
                // aData.forEach(element => {
                //     if(element.key === sKey){

                //     }
                // });
                this.getOwnerComponent().getModel("userModel").refresh(true);
                // this.getView().byId("idNL").setSelectedKey(sKey);
            },
            getFormattedDate: function () {
                var today = new Date();
                var dd = today.getDate();

                var mm = today.getMonth() + 1;
                var yyyy = today.getFullYear();
                if (dd < 10) {
                    dd = "0" + dd;
                }
                if (mm < 10) {
                    mm = "0" + mm;
                }
                return dd + '/' + mm + '/' + yyyy;
            },
            openCountryValueHelpDialog: function (oEvent) {
                var oView = this.getView();

                if (!this._pValueHelpDialog) {
                    this._pValueHelpDialog = Fragment.load({
                        id: oView.getId(),
                        name: "com.ferrero.zmrouiapp.view.fragments.CountryValueHelpDialog",
                        controller: this
                    }).then(function (oValueHelpDialog) {
                        oView.addDependent(oValueHelpDialog);
                        return oValueHelpDialog;
                    });
                }
                this._pValueHelpDialog.then(function (oValueHelpDialog) {
                    this._configValueHelpDialog();
                    oValueHelpDialog.open();
                }.bind(this));
            },
            countryValueHelpClose: function (oEvent, sFragmentID, sInputID, sTextID) {
                var oSelectedItem = oEvent.getParameter("selectedItem"),
                    oInput = this.byId(sap.ui.core.Fragment.createId(sFragmentID, sInputID));
                if (!oSelectedItem) {
                    oInput.resetProperty("value");
                    this.byId(sap.ui.core.Fragment.createId(sFragmentID, sTextID)).setText("");
                    return;
                }
                oInput.setValue(oSelectedItem.getTitle());
                this.byId(sap.ui.core.Fragment.createId(sFragmentID, sTextID)).setText(oSelectedItem.getDescription());
            },
            routeAuthValidation(sRoute) {
                var oModel = this.getOwnerComponent().getModel("userModel");
                var oData = oModel.getData();
                var role = oData.role;
                var aCDTRoutes = ["vendorList", "pricingCond", "myInbox"];
                var aLDTRoutes = ["pricingCond", "myInbox"];
                var aManagerRoutes = ["myInbox"];
                var oRouter = this.getOwnerComponent().getRouter();
                if (role) {
                    if (role.role_role === "CDT") {
                        if (aCDTRoutes.includes(sRoute)) {
                            oRouter.navTo(sRoute);
                        } else {
                            oRouter.navTo("notFound");
                        }
                    } else if (role.role_role === "LDT") {
                        if (aLDTRoutes.includes(sRoute)) {
                            oRouter.navTo(sRoute);
                        } else {
                            oRouter.navTo("notFound");
                        }
                    } else if (role.role_role === "LP" || role.role_role === "GCM") {
                        if (aManagerRoutes.includes(sRoute)) {
                            oRouter.navTo(sRoute);
                        } else {
                            oRouter.navTo("notFound");
                        }
                    } else {
                        this.getOwnerComponent().getRouter().navTo("notFound");
                        // window.location.reload();
                    }
                } else {
                    this.getOwnerComponent().getRouter().navTo("notFound");
                    // window.location.reload();
                }
            }
        });
    }
);
