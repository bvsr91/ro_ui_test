sap.ui.define(
    [
        "./BaseController",
        "../model/formatter",
        "sap/ui/core/IconPool",
        "sap/ui/model/json/JSONModel",
        "sap/m/Link",
        "sap/m/MessageItem",
        "sap/m/MessageView",
        "sap/m/Button",
        "sap/m/Dialog",
        "sap/m/Bar",
        "sap/m/Title",
        "sap/m/MessageToast",
        "sap/m/MessageStrip"
    ],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (
        BaseController, formatter, IconPool, JSONModel, Link, MessageItem, MessageView, Button, Dialog, Bar, Title, MessageToast, MessageStrip) {
        "use strict";

        return BaseController.extend("com.ferrero.zmrouiapp.controller.App", {
            formatter: formatter,
            onInit: function () {

                // this.getUser();
            },
            getUser: function () {
                this._userModel = this.getOwnerComponent().getModel("userModel");
                let me = this;
                fetch("/getUserInfo")
                    .then(res => res.json())
                    .then(data => {
                        me._userModel.setProperty("/jwtData", data);
                    })
                    .catch(err => console.log(err));
            },

            onSideNavButtonPress: function () {
                var oToolPage = this.byId("app");
                var bSideExpanded = oToolPage.getSideExpanded();
                oToolPage.setSideExpanded(!oToolPage.getSideExpanded());
            },
            onItemSelect: function (oEvent) {
                var oToolPage = this.byId("app");
                var bSideExpanded = oToolPage.getSideExpanded();
                var sSelKey = oEvent.getParameters("Item").item.getProperty("key");
                this.byId("app").setSideExpanded(false);
                this.getRouter().navTo(sSelKey);
            },
            onItemClose: function (oEvent) {
                var oItem = oEvent.getSource(),
                    oList = oItem.getParent();
                oList.removeItem(oItem);
                MessageToast.show("Notification Closed: " + oItem.getTitle());
            },


            handleNotificationPress: function (oEvent) {
                if (!this._oDialog1) {
                    this._oDialog1 = sap.ui.xmlfragment(this.createId("frgNotification"), "com.fe.mroecat.view.fragments.Notifications", this);
                    this.getView().addDependent(this._oDialog1);
                }
                // this._oDialog.open();
                this._oDialog1.toggle(oEvent.getSource());
            },
            onNotificationPress: function (oEvent) {
                if (!this._oDialog) {
                    this._oDialog = sap.ui.xmlfragment(
                        this.createId("frgMyInboxNotification"), "com.fe.mroecat.view.fragments.MyInboxNotification", this);
                    this.getView().addDependent(this._oDialog);
                }
                // this._oDialog.open();
                this._oDialog.openBy(oEvent.getSource());
            },
            onCloseNotification: function () {
                if (this._oDialog) {
                    this._oDialog.close();
                    this._oDialog.destroy();
                    this._oDialog = undefined;
                }
            },
            onListItemPress: function (oEvent) {
                MessageToast.show("Item Pressed: " + oEvent.getSource().getTitle());
            },



            onItemClose: function (oEvent) {
                var oItem = oEvent.getSource(),
                    oList = oItem.getParent();



                oList.removeItem(oItem);
                MessageToast.show("Item Closed: " + oItem.getTitle());
            },



            onRejectPress: function () {
                MessageToast.show("Reject Button Pressed");
            },


            onAcceptPress: function () {
                MessageToast.show("Accept Button Pressed");
            },



            onAcceptErrors: function (oEvent) {
                var oMessageStrip = new MessageStrip({
                    type: MessageType.Error,
                    showIcon: true,
                    showCloseButton: true,
                    text: "Error: Something went wrong.",
                    link: new Link({
                        text: "SAP CE",
                        href: "http://www.sap.com/",
                        target: "_blank"
                    })
                });



                var oNotificationListGroup = oEvent.getSource().getParent().getParent();
                var aNotifications = oNotificationListGroup.getItems();



                aNotifications.forEach(function (oNotification) {
                    oNotification.removeAllAggregation("processingMessage");
                });



                var iErrorIndex = Math.floor(Math.random() * 3);
                aNotifications[iErrorIndex].setProcessingMessage(oMessageStrip);
            },
            onItemSelectMsgView: function () {
                // this.getView().byId("idBtnBack").setVisible(true);
                this.getView()
                    .byId(sap.ui.core.Fragment.createId("frgNotification", "idBtnBack"))
                    .setVisible(true);
            },
            onMsgBtnBackPress: function () {
                this.getView()
                    .byId(sap.ui.core.Fragment.createId("frgNotification", "idMsgView"))
                    .navigateBack();
                this.getView()
                    .byId(sap.ui.core.Fragment.createId("frgNotification", "idBtnBack"))
                    .setVisible(false);
            },
        });
    }
);
