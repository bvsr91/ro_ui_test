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
    ],
    function (
        BaseController, JSONModel, Filter, Sorter, FilterOperator, GroupHeaderListItem, Device, Fragment, formatter, utilController) {
        "use strict";

        return BaseController.extend("com.ferrero.zmrouiapp.controller.MyInbox", {
            formatter: formatter,

            /* =========================================================== */
            /* lifecycle methods                                           */
            /* =========================================================== */

            /**
             * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
             * @public
             */
            onInit: function () {
                this.getRouter().getRoute("myInbox").attachPatternMatched(this._onRouteMatched, this);
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

                this.setSelKey("myInbox");
                this.routeAuthValidation("myInbox");
            },
            handleResponsivePopoverPress: function (oEvent) {
                var oButton = oEvent.getSource(),
                    oView = this.getView();

                if (!this._pPopover) {
                    this._pPopover = Fragment.load({
                        id: oView.getId(),
                        name: "com.ferrero.ztestmro.fragments.Popover",
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
            onItemClose: function (oEvent) {
                var oItem = oEvent.getSource(),
                    oList = oItem.getParent();
                oList.removeItem(oItem);
                MessageToast.show("Notification Closed: " + oItem.getTitle());
            },
            onNotificationAction: function (oEvent) {
                var oInput = oEvent.getSource(),
                    oBinding = oInput.getParent().getBindingContext("notificationData").getObject();
                //   bEnDevelopment = oBinding.MyDevelopment === "X",
                var oPopover = new sap.m.Popover({
                    placement: "Bottom",
                    showHeader: false,
                    content: [
                        new sap.m.HBox({
                            items: [
                                new sap.ui.core.Icon({
                                    src: "sap-icon://display",
                                    size: "1.0rem",
                                    color: "Neutral",
                                }).addStyleClass("sapUiTinyMarginBeginEnd"),
                                new sap.m.Link({
                                    text: "Display",
                                    press: this.onDisplay.bind(this, oInput),
                                    enabled: true,
                                    wrapping: true,
                                }).addStyleClass("sapUiNoMarginTop"),
                            ],
                        }).addStyleClass("sapUiSmallMarginTopBottom linkColorDispaly"),
                        new sap.m.HBox({
                            items: [
                                new sap.ui.core.Icon({
                                    src: "sap-icon://accept",
                                    size: "1.0rem",
                                    color: sap.ui.core.IconColor.Positive,
                                    //   color: "#BC9D61",
                                }).addStyleClass("sapUiTinyMarginBeginEnd"),
                                new sap.m.Link({
                                    text: "Approve",
                                    press: this.onApproval.bind(this, oInput),
                                    enabled: true,
                                    wrapping: true,
                                }),
                            ],
                        }).addStyleClass("sapUiSmallMarginTopBottom sapUiSmallMarginEnd linkColorApprove"),
                        new sap.m.HBox({
                            items: [
                                new sap.ui.core.Icon({
                                    src: "sap-icon://decline",
                                    size: "1.0rem",
                                    color: "red",
                                    //   ,
                                    //   color: "#BC9D61",
                                }).addStyleClass("sapUiTinyMarginBeginEnd"),
                                new sap.m.Link({
                                    text: "Reject",
                                    enabled: true,
                                    press: this.onReject.bind(this, oInput),
                                    wrapping: true,
                                }),
                            ],
                        }).addStyleClass("sapUiSmallMarginBottom linkColorReject"),
                    ],
                });

                oPopover.openBy(oInput);
            },
            onApproval: function () {

            },
            onReject: function (oInput, oEvent) {
                var oDialogRej = utilController.createDialog(oInput, oEvent);
                oDialogRej.open();
            },
            onDisplay: function (oInput, oEvent) {

            },
            onSearch: function (oEvent) {
                var aFilters = [];
                var sQuery = oEvent.getSource().getValue();
                if (sQuery && sQuery.length > 0) {
                    var filter = new Filter("author", FilterOperator.Contains, sQuery);
                    aFilters.push(filter);
                }
                var oList = this.byId("notificationData");
                var oBinding = oList.getBinding("items");
                oBinding.filter(aFilters, "Application");
            },
        });
    }
);
