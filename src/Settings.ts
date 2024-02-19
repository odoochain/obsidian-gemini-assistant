import { PluginSettingTab, Setting } from 'obsidian'
import GeminiAssistantPlugin from 'main'
import { type Model } from 'GeminiService'
import GeminiModelSetting from 'GeminiModelSetting'

export enum Scope {
    DOCUMENT = 'DOCUMENT',
    SELECTION = 'SELECTION',
}

export interface GeminiPrompt extends GeminiChat {
    display: string
    scope: Scope
    prompt: string | any[]
}

export interface GeminiChat {
    config: GeminiConfig
    model: Model
    type: 'chat' | 'generative'
}

export type GeminiConfig = {
    stopSequences?: string[]
    outputTokenLimit: number
    maxOutputTokens: number
    temperature: number
    topP: number
    topK: number
    inputTokenLimit: number
}

export interface Settings {
    apiKey: string
    model: Model
    prompts: GeminiPrompt[]
    chat: GeminiChat
}

export const DEFAULT_GEMINI_CONFIGS: Record<Model, GeminiConfig> = {
    'gemini-pro': {
        topK: 1,
        topP: 1,
        temperature: 0.9,
        outputTokenLimit: 2048,
        maxOutputTokens: 400,
        inputTokenLimit: 30720,
    },
    'gemini-pro-vision': {
        topK: 32,
        topP: 1,
        temperature: 0.4,
        outputTokenLimit: 4096,
        maxOutputTokens: 400,
        inputTokenLimit: 12288,
    },
}

export const DEFAULT_SETTINGS: Settings = {
    apiKey: '',
    model: 'gemini-pro',
    prompts: [
        {
            display: 'Ask Gemini (Selection)',
            scope: Scope.SELECTION,
            model: 'gemini-pro',
            config: DEFAULT_GEMINI_CONFIGS['gemini-pro'],
            prompt: '',
            type: 'generative',
        },
        {
            display: 'Ask Gemini (Document)',
            scope: Scope.DOCUMENT,
            model: 'gemini-pro',
            config: DEFAULT_GEMINI_CONFIGS['gemini-pro'],
            prompt: '',
            type: 'generative',
        },
    ],
    chat: {
        model: 'gemini-pro',
        config: DEFAULT_GEMINI_CONFIGS['gemini-pro'],
        type: 'chat',
    },
}

export default class GeminiSettings extends PluginSettingTab {
    private settings: Settings
    private plugin: GeminiAssistantPlugin

    constructor(plugin: GeminiAssistantPlugin, settings: Settings) {
        super(plugin.app, plugin)
        this.plugin = plugin
        this.settings = settings
    }

    public async updateSettings(
        newSettings: Partial<Settings>,
        refresh: boolean = false,
    ) {
        this.settings = { ...this.settings, ...newSettings }
        await this.plugin.saveData(this.settings)
        if (refresh) {
            this.display()
        }
    }

    public display() {
        const { containerEl } = this
        containerEl.empty()

        new Setting(containerEl).setName('API key').addText((text) => {
            text.setValue(this.settings.apiKey)
            text.onChange((apiKey) => {
                this.updateSettings({ apiKey })
            })
            // TODO add test button
        })

        new Setting(containerEl)
            .setName('Chat setting')
            .addExtraButton((button) => {
                button.setIcon('settings')
                button.setTooltip('Edit')
                button.onClick(() => {
                    new GeminiModelSetting(
                        this.plugin,
                        this.settings.chat,
                        (updated) => {
                            this.updateSettings({ chat: updated }, true)
                        },
                    ).open()
                })
            })

        new Setting(containerEl)
            .setHeading()
            .setName('Prompts')
            .addExtraButton((button) => {
                button.setIcon('plus')
                button.setTooltip('Add prompt')
                button.onClick(() => {
                    let prompt: GeminiPrompt = {
                        display: 'Custom prompt',
                        scope: Scope.SELECTION,
                        model: 'gemini-pro',
                        config: DEFAULT_GEMINI_CONFIGS['gemini-pro'],
                        prompt: '',
                        type: 'generative',
                    }
                    new GeminiModelSetting(this.plugin, prompt, (n) => {
                        this.updateSettings(
                            {
                                prompts: [
                                    ...this.settings.prompts,
                                    n as GeminiPrompt,
                                ],
                            },
                            true,
                        )
                    }).open()
                })
            })

        for (let i = 0; i < this.settings.prompts.length; i++) {
            new Setting(containerEl)
                .setName(this.settings.prompts[i].display)
                .addExtraButton((button) => {
                    button.setIcon('settings')
                    button.setTooltip('Edit')
                    button.onClick(() => {
                        new GeminiModelSetting(
                            this.plugin,
                            this.settings.prompts[i],
                            (updated) => {
                                let prompts = [...this.settings.prompts]
                                prompts[i] = updated as GeminiPrompt
                                this.plugin.updateSettings({ prompts }, true)
                            },
                        ).open()
                    })
                })
                .addExtraButton((button) => {
                    button.setIcon('trash')
                    button.setTooltip('Remove')
                    button.onClick(() => {
                        this.settings.prompts.splice(i, 1)
                        this.updateSettings(
                            { prompts: this.settings.prompts },
                            true,
                        )
                    })
                })
        }
    }

    public getSettings(): Settings {
        return this.settings
    }
}
