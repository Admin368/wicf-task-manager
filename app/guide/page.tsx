import fs from "fs";
import path from "path";
import { MDXRemote } from "next-mdx-remote/rsc";
import Image from "next/image";

const components = {
  img: ({ src, alt }: { src: string; alt: string }) => {
    if (src.startsWith("[Screenshot placeholder:")) {
      return (
        <div className="my-4 p-4 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-center text-gray-500 italic">
            {alt ||
              src.replace("[Screenshot placeholder:", "").replace("]", "")}
          </p>
        </div>
      );
    }
    return (
      <Image
        src={src}
        alt={alt}
        width={800}
        height={600}
        className="rounded-lg my-4"
      />
    );
  },
};

export default async function GuidePage() {
  const filePath = path.join(process.cwd(), "docs", "user-guide.md");
  const fileContent = fs.readFileSync(filePath, "utf8");

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto dark:prose-invert">
        <MDXRemote source={fileContent} components={components} />
      </div>
    </div>
  );
}
