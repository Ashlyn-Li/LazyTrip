import type { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
};

export const PageContainer = ({ children }: PageContainerProps) => (
  <div className="mx-auto min-h-screen w-full max-w-6xl px-5 sm:px-8">{children}</div>
);
