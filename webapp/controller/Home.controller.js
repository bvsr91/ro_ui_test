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
    ],
    function (
        BaseController, JSONModel, Filter, Sorter, FilterOperator, GroupHeaderListItem, Device, Fragment, formatter) {
        "use strict";

        return BaseController.extend("com.ferrero.zmrouiapp.controller.Home", {
            formatter: formatter,

            /* =========================================================== */
            /* lifecycle methods                                           */
            /* =========================================================== */

            /**
             * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
             * @public
             */
            onInit: function () {
                this.getRouter().getRoute("home").attachPatternMatched(this._onRouteMatched, this);
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
                this.setSelKey("home");
            },
            handleResponsivePopoverPress: function (oEvent) {
                var oButton = oEvent.getSource(),
                    oView = this.getView();

                if (!this._pPopover) {
                    this._pPopover = Fragment.load({
                        id: oView.getId(),
                        name: "com.ferrero.zmrouiapp.fragments.Popover",
                        controller: this,
                    }).then(function (oPopover) {
                        oView.addDependent(oPopover);
                        // oPopover.bindElement("/ProductCollection/0");
                        return oPopover;
                    });
                }
                this._pPopover.then(function (oPopover) {
                    oPopover.openBy(oButton);
                });
            },

            handleCloseButton: function (oEvent) {
                // note: We don't need to chain to the _pPopover promise, since this event-handler
                // is only called from within the loaded dialog itself.
                this.byId("myPopover").close();
            },
            onLinksDownload: function (oEvent) {
                var oInput = oEvent.getSource(),
                    oBinding = oInput
                        .getParent()
                        .getBindingContext("vendorData")
                        .getObject();
                //   bEnDevelopment = oBinding.MyDevelopment === "X",
                var oPopover = new sap.m.Popover({
                    placement: "Bottom",
                    showHeader: false,
                    content: [
                        new sap.m.HBox({
                            items: [
                                new sap.ui.core.Icon({
                                    src: "sap-icon://edit",
                                    size: "1.0rem",
                                    //   color: "#BC9D61",
                                }).addStyleClass("sapUiSmallMarginBeginEnd"),
                                new sap.m.Link({
                                    text: "Modify",
                                    press: this.onModify.bind(this, oInput),
                                    enabled: true,
                                    wrapping: true,
                                }),
                            ],
                        }).addStyleClass("sapUiSmallMarginTopBottom sapUiSmallMarginEnd"),
                        new sap.m.HBox({
                            items: [
                                new sap.ui.core.Icon({
                                    src: "sap-icon://delete",
                                    size: "1.0rem"
                                    //   ,
                                    //   color: "#BC9D61",
                                }).addStyleClass("sapUiSmallMarginBeginEnd"),
                                new sap.m.Link({
                                    text: "Delete",
                                    enabled: true,
                                    press: this.onDelete.bind(this, oEvent, oInput),
                                    wrapping: true,
                                }),
                            ],
                        }).addStyleClass("sapUiSmallMarginBottom"),
                    ],
                });

                oPopover.openBy(oInput);
            },
            onModify: function () { },
            onDelete: function () { },
        });
    }
);
