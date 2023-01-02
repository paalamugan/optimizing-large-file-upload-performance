import type { FC, PropsWithChildren } from "react";

const SiteLayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="remix-app">
      <header className="remix-app__header">
        {/* Header content goes here..HeaderContentdsssd? */}
      </header>
      <div className="remix-app__main">
        <div className="container mx-auto remix-app__main-content">
          {children}
        </div>
      </div>
      <footer className="remix-app__footer">
        {/* Footer content goes here..FooterContent? */}
      </footer>
    </div>
  );
};

export default SiteLayout;
