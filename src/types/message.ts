//to infer the type of the data we get from trpc

import { AppRouter } from "@/trpc";
import { inferRouterOutputs } from "@trpc/server";

type RouterOutput = inferRouterOutputs<AppRouter>
type Messages = RouterOutput["getFileMessages"]["messages"]

//to accomodate for the JSX element in the loader in the messages.tsx
type OmitText = Omit<Messages[number], "text">

type ExtendedText = {
    text:string| JSX.Element
}

export type ExtendedMessage = OmitText & ExtendedText