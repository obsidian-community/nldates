import { MarkdownView, ObsidianProtocolData, Plugin } from "obsidian";

import DatePickerModal from "./modals/date-picker";
import NLDParser, { NLDResult } from "./parser";
import { NLDSettingsTab, NLDSettings, DEFAULT_SETTINGS } from "./settings";
import DateSuggest from "./suggest/date-suggest";
import {
  getParseCommand,
  getCurrentDateCommand,
  getCurrentTimeCommand,
  getNowCommand,
} from "./commands";
import { getFormattedDate, getOrCreateDailyNote, parseTruthy } from "./utils";

export default class NaturalLanguageDates extends Plugin {
  private parser: NLDParser;
  public settings: NLDSettings;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.addCommand({
      id: "nlp-dates",
      name: "Parse natural language date",
      icon: 'calendar-check',
      callback: () => getParseCommand(this, "replace"),
    });

    this.addCommand({
      id: "nlp-dates-link",
      name: "Parse natural language date (as link)",
      icon: 'calendar-fold',
      callback: () => getParseCommand(this, "link"),
    });

    this.addCommand({
      id: "nlp-date-clean",
      name: "Parse natural language date (as plain text)",
      icon: 'calendar-days',
      callback: () => getParseCommand(this, "clean"),
    });

    this.addCommand({
      id: "nlp-parse-time",
      name: "Parse natural language time",
      icon: 'clock',
      callback: () => getParseCommand(this, "time"),
    });

    this.addCommand({
      id: "nlp-now",
      name: "Insert the current date and time",
      icon: 'calendar-clock',
      callback: () => getNowCommand(this),
    });

    this.addCommand({
      id: "nlp-today",
      name: "Insert the current date",
      icon: 'calendar-plus',
      callback: () => getCurrentDateCommand(this),
    });

    this.addCommand({
      id: "nlp-time",
      name: "Insert the current time",
      icon: 'clock-plus',
      callback: () => getCurrentTimeCommand(this),
    });

    this.addCommand({
      id: "nlp-picker",
      name: "Date picker",
      icon: 'calendar',
      checkCallback: (checking: boolean) => {
        if (checking) {
          return !!this.app.workspace.getActiveViewOfType(MarkdownView);
        }
        new DatePickerModal(this.app, this).open();
      },
    });

    this.addSettingTab(new NLDSettingsTab(this.app, this));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.registerObsidianProtocolHandler("nldates", this.actionHandler.bind(this));
    this.registerEditorSuggest(new DateSuggest(this.app, this));

    this.app.workspace.onLayoutReady(() => {
      // initialize the parser when layout is ready so that the correct locale is used
      this.parser = new NLDParser();
    });
  }

  onunload(): void {
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()) as NLDSettings;
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  /*
    @param dateString: A string that contains a date in natural language, e.g. today, tomorrow, next week
    @param format: A string that contains the formatting string for a Moment
    @returns NLDResult: An object containing the date, a cloned Moment and the formatted string.
  */
  parse(dateString: string, format: string): NLDResult {
    const date = this.parser.getParsedDate(dateString, this.settings.weekStart);
    const formattedString = getFormattedDate(date, format);
    if (formattedString === "Invalid date") {
      console.debug("Input date " + dateString + " can't be parsed by nldates");
    }

    return {
      formattedString,
      date,
      moment: window.moment(date),
    };
  }

  /*
    @param dateString: A string that contains a date in natural language, e.g. today, tomorrow, next week
    @returns NLDResult: An object containing the date, a cloned Moment and the formatted string.
  */
  parseDate(dateString: string): NLDResult {
    return this.parse(dateString, this.settings.format);
  }

  parseTime(dateString: string): NLDResult {
    return this.parse(dateString, this.settings.timeFormat);
  }

  async actionHandler(params: ObsidianProtocolData): Promise<void> {
    const { workspace } = this.app;

    const date = this.parseDate(params.day);
    const newPane = parseTruthy(params.newPane || "yes");

    if (date.moment.isValid()) {
      const dailyNote = await getOrCreateDailyNote(date.moment);
      await workspace.getLeaf(newPane).openFile(dailyNote);
    }
  }
}
