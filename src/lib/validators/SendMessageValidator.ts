import {z} from "zod"

export const SendMessageValidator = z.object ({
    fileId: z.string(),
    message: z.string(), //so whatever we user input in this is gonna be the message
})