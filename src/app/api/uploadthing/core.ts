import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { pinecone } from "@/lib/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { PLANS } from "@/config/stripe";
import { getUserSubscriptionPlan } from "@/lib/stripe";

const f = createUploadthing();

const middleware = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user || !user.id) throw new Error("Unauthorized");
  const subscriptionPlan = await getUserSubscriptionPlan();
  return { subscriptionPlan, userId: user.id };
};

const onUploadComplete = async ({
  metadata,
  file,
}: {
  metadata: Awaited<ReturnType<typeof middleware>>;
  file: {
    key: string;
    name: string;
    url: string;
  };
}) => {
  const isFileExist = await db.file.findFirst({
    where: {
      key: file.key,
    },
  });
  if (isFileExist) return;
  const createdFile = await db.file.create({
    data: {
      key: file.key,
      name: file.name,
      userId: metadata.userId,
      url: `https://utfs.io/f/${file.key}`,
      uploadStatus: "PROCESSING",
    },
  });

      try {
        //we need the pdf file to index it and vectorise it in order to see how many pages it has
        const response = await fetch(`https://utfs.io/f/${file.key}`);
        const blob = await response.blob();
        //to load the pdf file in memory
        const loader = new PDFLoader(blob);
        //to extract PageLevel content meaning the page content
        const pageLevelDocs = await loader.load();
        //to check pages per pdf to determine for the free and pro plan
        const pagesAmt = pageLevelDocs.length;

        const { subscriptionPlan } = metadata;
        const { isSubscribed } = subscriptionPlan;

        const isProExceeded =
          pagesAmt > PLANS.find((plan) => plan.name === "Pro")!.pagesPerPdf;
        const isFreeExceeded =
          pagesAmt > PLANS.find((plan) => plan.name === "Free")!.pagesPerPdf;

        if (
          (isSubscribed && isProExceeded) ||
          (!isSubscribed && isFreeExceeded)
        ) {
          await db.file.update({
            data: { uploadStatus: "FAILED" },
            where: {
              id: createdFile.id,
            },
          });
        }

        //vectorize and index entire document
        const pineconeIndex = pinecone.Index("reed");

        const embeddings = new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_API_KEY,
        });

        await PineconeStore.fromDocuments(pageLevelDocs, embeddings, {
          pineconeIndex,
          namespace: createdFile.id,
        }); //to tell the langchain how to generate the vectors from the text using Openai model

        await db.file.update({
          data: {
            uploadStatus: "SUCCESS",
          },
          where: {
            id: createdFile.id, //where the id of the file matched the createdfile.id
          },
        });
      } catch (err) {
        await db.file.update({
          data: {
            uploadStatus: "FAILED",
          },
          where: {
            id: createdFile.id, //where the id of the file matched the createdfile.id
          },
        });
      }
    };
    
    export const ourFileRouter = {
      freePlanUploader: f({ "application/pdf": { maxFileSize: "4MB" } })
        .middleware(middleware)
        .onUploadComplete(onUploadComplete),
    
        proPlanUploader: f({ "application/pdf": { maxFileSize: "16MB" } })
        .middleware(middleware)
        .onUploadComplete(onUploadComplete),
    } satisfies FileRouter;
    
    export type OurFileRouter = typeof ourFileRouter;
