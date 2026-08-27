import type { MessageKey, MessageValues } from "@/i18n/messages"

export type Translator = (key: MessageKey, values?: MessageValues) => string
