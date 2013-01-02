/*
 * This file is part of Bumblebee Indicator Gnome Shell Extension.
 *
 * Bumblebee Indicator Gnome Shell Extension is free software; you can
 * redistribute it and/or modify it under the terms of the GNU General
 * Public License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
 * MA 02110-1301, USA.
 *
 * Author: Alessio Gaeta <alga777@gmail.com>
 *
 */


const Lang = imports.lang;

const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const St = imports.gi.St;

const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;
const MessageTray = imports.ui.messageTray;

const ExtensionUtils = imports.misc.extensionUtils;
const Local = ExtensionUtils.getCurrentExtension();
const Convenience = Local.imports.convenience;

const Gettext = imports.gettext;
const _ = Gettext.domain('bumblebee-indicator').gettext;


function ExtensionController(extensionMeta) {
    return {
        extensionMeta: extensionMeta,
        extension: null,

        enable: function() {
            this.extension = new BumblebeeIndicator(this.extensionMeta);

            Main.panel.addToStatusArea('bumblebee-indicator', this.extension.button, 0, 'right');
            //Main.panel.menuManager.addMenu(this.extension.menu);
        },

        disable: function() {
            //Main.panel.menuManager.removeMenu(this.extension.menu);
            this.extension.destroy();
        }
    }
}


function BumblebeeIndicator(extensionMeta) {
    this._init(extensionMeta);
}

BumblebeeIndicator.prototype = {

    _init: function(extensionMeta) {

        this.extensionMeta = extensionMeta;

        this.config         = new Convenience.Config();

        this._activeIcon    = Gio.Icon.new_for_string(this.extensionMeta.path + '/images/bumblebee-indicator-active.svg');
        this._unactiveIcon  = Gio.Icon.new_for_string(this.extensionMeta.path + '/images/bumblebee-indicator.svg');

        this._lockFile      = '/tmp/.X' + this.config.virtualDisplay + '-lock';
        this._lockMonitor   = Gio.File.new_for_path(this._lockFile).monitor_file(Gio.FileMonitorFlags.NONE, null);
        this._lockMonitor.id = this._lockMonitor.connect('changed', Lang.bind(this, this._statusChanged));

        this.button         = new PanelMenu.SystemStatusButton();
        this.button.setName('bumblebee-indicator');
        this.button.setGIcon(this._unactiveIcon);

        this.notificationSource = new Convenience.BumblebeeNotificationSource(this._unactiveIcon);
        Main.messageTray.add(this.notificationSource);

        // TODO: Add menu to launch Bumblebee Application Settings
        //this.setMenu(new PopupMenu.PopupMenu(this.actor, menuAlignment, St.Side.TOP, 0));
        //let item = new PopupMenu.PopupMenuItem(_("Show Overview"));
        //this._button.menu.addMenuItem(item);

        // Notification system initialization
        //Notify.init('Bumblebee Indicator');

    },

    _statusChanged: function(monitor, a_file, other_file, event_type) {
        if (event_type == Gio.FileMonitorEvent.CREATED) {
            this._setStatus(true);
            this._notifyStatus(null, _("Bumblebee is active"), this._activeIcon);

        } else if (event_type ==  Gio.FileMonitorEvent.DELETED) {
            this._setStatus(false);
            this._notifyStatus(null, _("Bumblebee is unactive"), this._unactiveIcon);
        }
    },

    _setStatus: function(active, notify) {
        notify = typeof notify !== 'undefined' ? notify : true;

        if (active) {
            this.button.setGIcon(this._activeIcon);
        } else {
            this.button.setGIcon(this._unactiveIcon);
        }
    },

    _notifyStatus: function(title, msg, icon) {

        let stIcon = new St.Icon({gicon: icon, icon_size: MessageTray.NOTIFICATION_ICON_SIZE});
        let notification = new MessageTray.Notification(this.notificationSource,
                                                        title, msg, {icon: stIcon});

        this.notificationSource.notify(notification);
        notification.acknowledged = true;
    },

    destroy: function() {

        this._lockMonitor.disconnect(this._lockMonitor.id);

        this.button.destroy();
    }

}

function init(extensionMeta) {
    // Localization
    let userExtensionLocalePath = extensionMeta.path + '/locale';
    Gettext.bindtextdomain("bumblebee-indicator", userExtensionLocalePath);
    Gettext.textdomain("bumblebee-indicator");

    return new ExtensionController(extensionMeta);

}

