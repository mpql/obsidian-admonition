import {
    PluginSettingTab,
    Setting,
    App,
    ButtonComponent,
    Modal,
    TextComponent,
    Notice
} from "obsidian";
import { Admonition, ObsidianAdmonitionPlugin } from "../@types/types";

import { findIconDefinition, icon } from "./icons";

export default class AdmonitionSetting extends PluginSettingTab {
    plugin: ObsidianAdmonitionPlugin;
    constructor(app: App, plugin: ObsidianAdmonitionPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    async display(): Promise<void> {
        let { containerEl } = this;

        containerEl.empty();

        containerEl.createEl("h2", { text: "Admonition Settings" });

        new Setting(containerEl)
            .setName("Add New")
            .setDesc("Add a new Admonition type.")
            .addButton(
                (button: ButtonComponent): ButtonComponent => {
                    let b = button
                        .setTooltip("Add Additional")
                        .setButtonText("+")
                        .onClick(async () => {
                            let modal = new SettingsModal(this.app);

                            modal.onClose = async () => {
                                if (modal.saved) {
                                    this.plugin.addAdmonition({
                                        type: modal.type,
                                        color: modal.color,
                                        icon: modal.icon
                                    });
                                    this.display();
                                }
                            };

                            modal.open();
                        });

                    return b;
                }
            );

        for (let a in this.plugin.userAdmonitions) {
            const admonition = this.plugin.userAdmonitions[a];

            let setting = new Setting(containerEl);
            let admonitionElement = createDiv({
                cls: "admonition",
                attr: {
                    style: `--admonition-color: ${admonition.color}; margin: 0 !important; width: 50% !important;`
                }
            });
            const titleEl = admonitionElement.createDiv({
                cls: "admonition-title"
            });
            const iconEl = titleEl.createDiv({
                cls: "admonition-title-icon"
            });

            titleEl.createSpan({
                text:
                    admonition.type[0].toUpperCase() +
                    admonition.type.slice(1).toLowerCase()
            });
            if (admonition.icon) {
                iconEl.innerHTML = icon(
                    findIconDefinition({ iconName: admonition.icon })
                ).html[0];
            }
            setting.infoEl.replaceWith(admonitionElement);

            setting.addButton((b) => {
                b.setIcon("pencil")
                    .setTooltip("Edit")
                    .onClick(() => {
                        let modal = new SettingsModal(this.app, admonition);

                        modal.onClose = async () => {
                            if (modal.saved) {
                                this.plugin.addAdmonition({
                                    type: modal.type,
                                    color: modal.color,
                                    icon: modal.icon
                                });
                                this.display();
                            }
                        };

                        modal.open();
                    });
            });
            setting.addButton((b) => {
                b.setIcon("trash")
                    .setTooltip("Delete")
                    .onClick(() => {
                        this.plugin.removeAdmonition(admonition);
                        this.display();
                    });
            });
        }
    }
}

class SettingsModal extends Modal {
    color: string = "#7d7d7d";
    icon: string = "";
    type: string = "";
    saved: boolean = false;
    error: boolean = false;
    constructor(app: App, admonition?: Admonition) {
        super(app);
        if (admonition) {
            this.color = admonition.color;
            this.icon = admonition.icon;
            this.type = admonition.type;
        }
    }

    async display() {
        let { contentEl } = this;

        contentEl.empty();

        const settingDiv = contentEl.createDiv();
        const previewEl = contentEl.createDiv({
            cls: "admonition",
            attr: {
                style: `--admonition-color: ${this.color};`
            }
        });
        const titleEl = previewEl.createDiv({
            cls: "admonition-title"
        });
        const iconEl = titleEl.createDiv({
            cls: "admonition-title-icon"
        });

        const titleSpan = titleEl.createSpan({
            text: this.type.length
                ? this.type[0].toUpperCase() + this.type.slice(1).toLowerCase()
                : "..."
        });

        if (this.icon) {
            iconEl.innerHTML = icon(
                findIconDefinition({ iconName: this.icon })
            ).html[0];
        }
        previewEl.createDiv().createEl("p", {
            cls: "admonition-content",
            text:
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla et euismod nulla."
        });
        let typeText: TextComponent;
        new Setting(settingDiv)
            .setName("Admonition Type")
            .setDesc("This is used to create the admonition (e.g., ad-note)")

            .addText((text) => {
                typeText = text;
                typeText.setValue(this.type).onChange((v) => {
                    if (!v.length) {
                        SettingsModal.setValidationError(
                            text,
                            "Admonition type cannot be empty."
                        );
                        return;
                    }

                    if (v.includes(" ")) {
                        SettingsModal.setValidationError(
                            text,
                            "Admonition type cannot include spaces."
                        );
                        return;
                    }
                    SettingsModal.removeValidationError(text);

                    this.type = v;
                    titleSpan.textContent =
                        this.type[0].toUpperCase() +
                        this.type.slice(1).toLowerCase();
                });
            });
        let iconText: TextComponent;
        const iconSetting = new Setting(settingDiv)
            .setName("Admonition Icon")
            .addText((text) => {
                iconText = text;
                iconText.setValue(this.icon).onChange((v) => {
                    let ic = findIconDefinition({
                        iconName: v
                    });
                    if (!ic) {
                        SettingsModal.setValidationError(
                            text,
                            "Invalid icon name."
                        );
                        return;
                    }

                    if (v.length == 0) {
                        SettingsModal.setValidationError(
                            text,
                            "Icon cannot be empty."
                        );
                        return;
                    }

                    SettingsModal.removeValidationError(text);

                    this.icon = v;

                    iconEl.innerHTML = icon(ic).html[0];
                });
            });

        const desc = iconSetting.descEl.createDiv();
        desc.createEl("a", {
            text: "Font Awesome Icon",
            href: "https://fontawesome.com/icons?d=gallery&p=2&s=solid&m=free"
        });
        desc.createSpan({ text: " to use next to the title." });

        const color = new Setting(settingDiv).setName("Color");
        const colorInput = color.controlEl.createEl(
            "input",
            {
                type: "color",
                value: this.color
            },
            (el) => {
                el.value = rgbToHex(this.color);
                el.oninput = ({ target }) => {
                    let color = hexToRgb((target as HTMLInputElement).value);
                    console.log(
                        "🚀 ~ file: settings.ts ~ line 118 ~ SettingsModal ~ display ~ color",
                        color
                    );
                    if (!color) return;
                    this.color = `${color.r}, ${color.g}, ${color.b}`;
                    previewEl.setAttribute(
                        "style",
                        `--admonition-color: ${this.color};`
                    );
                };
            }
        );

        let footerEl = contentEl.createDiv();
        let footerButtons = new Setting(footerEl);
        footerButtons.addButton((b) => {
            b.setTooltip("Save")
                .setIcon("checkmark")
                .onClick(async () => {
                    let error = false;
                    if (!typeText.inputEl.value.length) {
                        SettingsModal.setValidationError(
                            typeText,
                            "Admonition type cannot be empty."
                        );
                        error = true;
                    }

                    if (typeText.inputEl.value.includes(" ")) {
                        SettingsModal.setValidationError(
                            typeText,
                            "Admonition type cannot include spaces."
                        );
                        error = true;
                    }

                    if (
                        !findIconDefinition({
                            iconName: iconText.inputEl.value
                        })
                    ) {
                        SettingsModal.setValidationError(
                            iconText,
                            "Invalid icon name."
                        );
                        error = true;
                    }

                    if (iconText.inputEl.value.length == 0) {
                        SettingsModal.setValidationError(
                            iconText,
                            "Icon cannot be empty."
                        );
                        error = true;
                    }

                    if (error) {
                        new Notice("Fix errors before saving.");
                        return;
                    }
                    this.saved = true;
                    this.close();
                });
            return b;
        });
        footerButtons.addExtraButton((b) => {
            b.setIcon("cross")
                .setTooltip("Cancel")
                .onClick(() => {
                    this.saved = false;
                    this.close();
                });
            return b;
        });
    }
    onOpen() {
        this.display();
    }

    static setValidationError(textInput: TextComponent, message?: string) {
        textInput.inputEl.addClass("is-invalid");
        if (message) {
            textInput.inputEl.parentElement.addClasses([
                "has-invalid-message",
                "unset-align-items"
            ]);
            textInput.inputEl.parentElement.parentElement.addClass(
                ".unset-align-items"
            );
            let mDiv = textInput.inputEl.parentElement.querySelector(
                ".invalid-feedback"
            ) as HTMLDivElement;

            if (!mDiv) {
                mDiv = createDiv({ cls: "invalid-feedback" });
            }
            mDiv.innerText = message;
            mDiv.insertAfter(textInput.inputEl);
        }
    }
    static removeValidationError(textInput: TextComponent) {
        textInput.inputEl.removeClass("is-invalid");
        textInput.inputEl.parentElement.removeClasses([
            "has-invalid-message",
            "unset-align-items"
        ]);
        textInput.inputEl.parentElement.parentElement.removeClass(
            ".unset-align-items"
        );

        if (textInput.inputEl.parentElement.children[1]) {
            textInput.inputEl.parentElement.removeChild(
                textInput.inputEl.parentElement.children[1]
            );
        }
    }
}

function hexToRgb(hex: string) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    console.log(
        "🚀 ~ file: settings.ts ~ line 156 ~ hexToRgb ~ result",
        result
    );
    return result
        ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16)
          }
        : null;
}
function componentToHex(c: number) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
function rgbToHex(rgb: string) {
    let result = /^(\d+),\s?(\d+),\s?(\d+)/i.exec(rgb);
    if (!result || result.length) {
        return "";
    }
    return `#${componentToHex(Number(result[1]))}${componentToHex(
        Number(result[2])
    )}${componentToHex(Number(result[3]))}`;
}
