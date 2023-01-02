import type { FC, PropsWithChildren } from "react";
import AppHeader from "./AppHeader";

type AppLayoutProps = {
  user?: Record<string, unknown>;
};

const AppLayout: FC<PropsWithChildren<AppLayoutProps>> = ({
  user,
  children,
}) => {
  return (
    <>
      <div className="header">
        <AppHeader user={user} />
      </div>
      <div className="container mx-auto">{children}</div>
    </>
  );
};

export default AppLayout;
