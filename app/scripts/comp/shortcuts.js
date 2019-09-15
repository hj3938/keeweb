const Features = require('../util/features');
const Keys = require('../const/keys');
const StringFormat = require('../util/formatting/string-format');
const AppSettingsModel = require('../models/app-settings-model');
const Launcher = require('./launcher');

let allowedKeys;

function getAllowedKeys() {
    if (!allowedKeys) {
        allowedKeys = {};
        for (const [name, code] of Object.entries(Keys)) {
            const keyName = name.replace('DOM_VK_', '');
            if (/^([0-9A-Z]|F\d{1,2})$/.test(keyName)) {
                allowedKeys[code] = keyName;
            }
        }
    }
    return allowedKeys;
}

const globalShortcuts = {
    copyPassword: { mac: 'Ctrl+Alt+C', all: 'Shift+Alt+C' },
    copyUser: { mac: 'Ctrl+Alt+B', all: 'Shift+Alt+B' },
    copyUrl: { mac: 'Ctrl+Alt+U', all: 'Shift+Alt+U' },
    autoType: { mac: 'Ctrl+Alt+T', all: 'Shift+Alt+T' }
};

const Shortcuts = {
    keyEventToShortcut(event) {
        const modifiers = [];
        if (event.ctrlKey) {
            modifiers.push('Ctrl');
        }
        if (event.altKey) {
            modifiers.push('Alt');
        }
        if (event.shiftKey) {
            modifiers.push('Shift');
        }
        if (Features.isMac && event.metaKey) {
            modifiers.push('Meta');
        }
        const keyName = getAllowedKeys()[event.which];
        return {
            value: modifiers.join('+') + '+' + (keyName || '…'),
            valid: modifiers.length > 0 && !!keyName
        };
    },
    presentShortcut(shortcutValue, formatting) {
        return shortcutValue
            .split(/\+/g)
            .map(part => {
                switch (part) {
                    case 'Ctrl':
                        return this.ctrlShortcutSymbol(formatting);
                    case 'Alt':
                        return this.altShortcutSymbol(formatting);
                    case 'Shift':
                        return this.shiftShortcutSymbol(formatting);
                    case 'Meta':
                        return this.actionShortcutSymbol(formatting);
                    default:
                        return part;
                }
            })
            .join('');
    },
    actionShortcutSymbol(formatting) {
        return Features.isMac ? '⌘' : formatting ? '<span class="thin">ctrl + </span>' : 'ctrl+';
    },
    altShortcutSymbol(formatting) {
        return Features.isMac ? '⌥' : formatting ? '<span class="thin">alt + </span>' : 'alt+';
    },
    shiftShortcutSymbol(formatting) {
        return Features.isMac ? '⇧' : formatting ? '<span class="thin">shift + </span>' : 'shift+';
    },
    ctrlShortcutSymbol(formatting) {
        return Features.isMac ? '⌃' : formatting ? '<span class="thin">ctrl + </span>' : 'ctrl+';
    },
    globalShortcutText(type, formatting) {
        return this.presentShortcut(this.globalShortcut(type), formatting);
    },
    globalShortcut(type) {
        const appSettingsShortcut = AppSettingsModel.instance.get(
            this.globalShortcutAppSettingsKey(type)
        );
        if (appSettingsShortcut) {
            return appSettingsShortcut;
        }
        const globalShortcut = globalShortcuts[type];
        if (globalShortcut) {
            if (Features.isMac && globalShortcut.mac) {
                return globalShortcut.mac;
            }
            return globalShortcut.all;
        }
        return undefined;
    },
    setGlobalShortcut(type, value) {
        if (!globalShortcuts[type]) {
            throw new Error('Bad shortcut: ' + type);
        }
        if (value) {
            AppSettingsModel.instance.set(this.globalShortcutAppSettingsKey(type), value);
        } else {
            AppSettingsModel.instance.unset(this.globalShortcutAppSettingsKey(type));
        }
        Launcher.setGlobalShortcuts(AppSettingsModel.instance.attributes);
    },
    globalShortcutAppSettingsKey(type) {
        return 'globalShortcut' + StringFormat.capFirst(type);
    },
    screenshotToClipboardShortcut() {
        if (Features.isiOS) {
            return 'Sleep+Home';
        }
        if (Features.isMobile) {
            return '';
        }
        if (Features.isMac) {
            return 'Command-Shift-Control-4';
        }
        if (Features.isWindows) {
            return 'Alt+PrintScreen';
        }
        return '';
    }
};

module.exports = Shortcuts;
