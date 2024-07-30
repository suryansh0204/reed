"use client";

import { Document, Page, pdfjs } from "react-pdf";
import { cn } from "@/lib/utils";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  RotateCw,
  Search,
} from "lucide-react";
import { useToast } from "./use-toast";
import { useResizeDetector } from "react-resize-detector";
import { Button } from "./button";
import { Input } from "./input";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

import SimpleBar from "simplebar-react";
import PdfFullscreen from "./PdfFullscreen";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

type PDFRendererProps = {
  url: string;
};

const PDFRenderer = ({ url }: PDFRendererProps) => {
  const { toast } = useToast();

  const [numPages, setNumPages] = useState<number>(); // in order to get the no. of pages to display on the input field that shows /no.of pages
  const [currPage, setCurrPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [renderedScale, setRenderedScale] = useState<number | null>(null);

  const isLoading = renderedScale !== scale;

  //whole logic for the validating typing the number in the box to page jump
  const CustomPageValidator = z.object({
    page: z
      .string()
      .refine((num) => Number(num) > 0 && Number(num) <= numPages!),
  });

  type TCustomPageValidator = z.infer<typeof CustomPageValidator>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TCustomPageValidator>({
    defaultValues: {
      page: "1",
    },
    resolver: zodResolver(CustomPageValidator),
  });
  //

  const { width, ref } = useResizeDetector();

  const handlePageSubmit = ({ page }: TCustomPageValidator) => {
    //function used when we press enter and jump page
    setCurrPage(Number(page));
    setValue("page", String(page));
  };

  const handlePrevPage = () => {
    setCurrPage((prev) => {
      const newPage = prev - 1 > 1 ? prev - 1 : 1;
      setValue("page", String(newPage));
      return newPage;
    });
  };

  const handleNextPage = () => {
    setCurrPage((prev) => {
      const newPage = prev + 1 > numPages! ? numPages! : prev + 1;
      setValue("page", String(newPage));
      return newPage;
    });
  };

  return (
    <div className="w-full bg-white rounded-md shadow flex flex-col items-center">
      <div className="h-14 w-full border-b border-zinc-200 flex items-center justify-between px-2">
        <div className="flex items-center gap-1.5">
          <Button
            disabled={currPage <= 1}
            onClick={handlePrevPage}
            variant="ghost"
            aria-label="previous page"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1.5"></div>
          <Input
            {...register("page")}
            className={cn(
              "w-12 h-8",
              errors.page && "focus-visible:ring-red-500"
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit(handlePageSubmit)();
              }
            }}
          />
          <p className="text-zinc-700 text-sm space-x-1">
            <span>/</span>
            <span>{numPages ?? "-"}</span>
          </p>

          <Button
            disabled={numPages === undefined || currPage === numPages}
            onClick={handleNextPage}
            variant="ghost"
            aria-label="next page"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-1.5" aria-label="zoom" variant="ghost">
                <Search className="h-4 w-4" />
                {scale * 100}%<ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setScale(0.5)}>
                50%
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setScale(0.75)}>
                75%
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setScale(1)}>
                100%
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setScale(1.5)}>
                150%
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setScale(2)}>
                200%
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setScale(2.5)}>
                250%
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => setRotation((prev) => prev + 90)}
            variant="ghost"
            aria-label="rotate 90 degree"
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          <PdfFullscreen fileUrl={url} />
        </div>
      </div>

      <div className="flex-1 w-full max-h-screen">
        <SimpleBar autoHide={false} className="max-h-[calc(100vh-10rem)]">
          <div
            ref={
              ref
            } /**this ref will link it to the resize detector hook and we will have the width which we can use*/
          >
            <Document
              loading={
                <div className="flex justify-center">
                  <Loader2 className="my-24 h-6 w-5 animate-spin" />
                </div>
              }
              onLoadError={() => {
                toast({
                  title: "Error loading page",
                  description: "Please try again later",
                  variant: "destructive",
                });
              }}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)} // for this - in order to get the no. of pages to display on the input field that shows /no.of pages
              file={url}
              className="max-h-full"
            >
              {isLoading && renderedScale ? (
                <Page
                  width={width ? width : 1}
                  pageNumber={
                    currPage
                  } /* and we are using the width saved above here*/
                  scale={scale} //same for scale like width
                  rotate={rotation}
                  key={"@"+ renderedScale}
                />
              ) : null}

              <Page
                className={cn(isLoading ? "hidden" : "")}
                width={width ? width : 1}
                pageNumber={currPage}
                scale={scale}
                rotate={rotation}
                key={"@"+ scale}
                loading={
                  <div className="flex justify-center">
                    <Loader2 className="my-24 h-6 w-6 animate-spin" />
                  </div>
                }
                onRenderSuccess={() => setRenderedScale(scale)}
              />
            </Document>
          </div>
        </SimpleBar>
      </div>
    </div>
  );
};

export default PDFRenderer;
