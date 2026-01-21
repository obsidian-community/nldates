import { App, PluginSettingTab, SettingGroup } from "obsidian";
import NaturalLanguageDates from "./main";
import { getLocaleWeekStart } from "./utils";

export type DayOfWeek =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "locale-default";

export interface NLDSettings {
  autosuggestToggleLink: boolean;
  autocompleteTriggerPhrase: string;
  isAutosuggestEnabled: boolean;

  format: string;
  timeFormat: string;
  separator: string;
  weekStart: DayOfWeek;

  modalToggleTime: boolean;
  modalToggleLink: boolean;
  modalMomentFormat: string;
}

export const DEFAULT_SETTINGS: NLDSettings = {
  autosuggestToggleLink: true,
  autocompleteTriggerPhrase: "@",
  isAutosuggestEnabled: true,

  format: "YYYY-MM-DD",
  timeFormat: "HH:mm",
  separator: " ",
  weekStart: "locale-default",

  modalToggleTime: false,
  modalToggleLink: false,
  modalMomentFormat: "YYYY-MM-DD HH:mm",
};

const weekdays = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export class NLDSettingsTab extends PluginSettingTab {
  plugin: NaturalLanguageDates;
  icon = 'calendar-plus';

  constructor(app: App, plugin: NaturalLanguageDates) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    const localizedWeekdays = window.moment.weekdays();
    const localeWeekStart = getLocaleWeekStart();

    containerEl.empty();

    new SettingGroup(containerEl)
      .setHeading('Parser')
      .addSetting(setting => {
        setting
        .setName("Date format")
            .setDesc("Output format for parsed dates")
            .addMomentFormat((text) =>
              text
                .setDefaultFormat("YYYY-MM-DD")
                .setValue(this.plugin.settings.format)
                .onChange(async (value) => {
                  this.plugin.settings.format = value || "YYYY-MM-DD";
                  await this.plugin.saveSettings();
                })
            )
      })
      .addSetting(setting => {
        setting
          .setName("Week starts on")
          .setDesc("Which day to consider as the start of the week")
          .addDropdown((dropdown) => {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            dropdown.addOption("locale-default", `Locale default (${localeWeekStart})`);
            localizedWeekdays.forEach((day, i) => {
              dropdown.addOption(weekdays[i], day);
            });
            dropdown.setValue(this.plugin.settings.weekStart.toLowerCase());
            dropdown.onChange(async (value: DayOfWeek) => {
              this.plugin.settings.weekStart = value;
              await this.plugin.saveSettings();
            });
          })
      });

    new SettingGroup(containerEl)
      .setHeading('Hotkey formatting')
      .addSetting(setting => {
        setting
        .setName("Time format")
            .setDesc("Format for the hotkeys that include the current time")
            .addMomentFormat((text) =>
              text
                .setDefaultFormat("HH:mm")
                .setValue(this.plugin.settings.timeFormat)
                .onChange(async (value) => {
                  this.plugin.settings.timeFormat = value || "HH:mm";
                  await this.plugin.saveSettings();
                })
            )
      })
      .addSetting(setting => {
        setting
          .setName("Separator")
          .setDesc("Separator between date and time for entries that have both")
          .addText((text) =>
            text
              .setPlaceholder("Separator is empty")
              .setValue(this.plugin.settings.separator)
              .onChange(async (value) => {
                this.plugin.settings.separator = value;
                await this.plugin.saveSettings();
              })
          )
      });

    new SettingGroup(containerEl)
      .setHeading("Date autosuggest")
      .addSetting((setting) => {
        setting
          .setName("Enable date autosuggest")
          .setDesc(
            `Input dates with natural language. Open the suggest menu with ${this.plugin.settings.autocompleteTriggerPhrase}`
          )
          .addToggle((toggle) =>
            toggle
              .setValue(this.plugin.settings.isAutosuggestEnabled)
              .onChange(async (value) => {
                this.plugin.settings.isAutosuggestEnabled = value;
                await this.plugin.saveSettings();
              })
          );
      })
      .addSetting(setting => {
        setting
          .setName("Add dates as link?")
          .setDesc(
            "If enabled, dates created via autosuggest will be wrapped in [[wikilinks]]"
          )
          .addToggle((toggle) =>
            toggle
              .setValue(this.plugin.settings.autosuggestToggleLink)
              .onChange(async (value) => {
                this.plugin.settings.autosuggestToggleLink = value;
                await this.plugin.saveSettings();
              })
          );
      }).addSetting(setting => {
        setting
        .setName("Trigger phrase")
            .setDesc("Character(s) that will cause the date autosuggest to open")
            .addMomentFormat((text) =>
              text
                .setPlaceholder(DEFAULT_SETTINGS.autocompleteTriggerPhrase)
                .setValue(this.plugin.settings.autocompleteTriggerPhrase || "@")
                .onChange(async (value) => {
                  this.plugin.settings.autocompleteTriggerPhrase = value.trim();
                  await this.plugin.saveSettings();
                })
            )
        });
  }
}
