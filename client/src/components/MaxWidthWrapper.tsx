import { cn } from "@/lib/utils";
import { ReactNode } from "react";

const MaxWidthWrapper = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => {
  return (
    <div className={cn("mx-auto max-w-[1340px] px-4 md:px-10", className)}>
      {children}
    </div>
  );
};
export default MaxWidthWrapper;
