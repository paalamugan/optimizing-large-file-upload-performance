import type { FC, PropsWithChildren } from "react";

type AppHeaderProps = {
  user?: Record<string, unknown>;
};

const AppHeader: FC<PropsWithChildren<AppHeaderProps>> = ({ user }) => {
  return (
    <nav className="w-full py-3 bg-blue-50 shadow-md ">
      <div className="container flex justify-end place-content-end">
        <ul className="list-none flex gap-4 text-center">
          <li className="flex gap-2">My App</li>
        </ul>
      </div>
    </nav>
  );
};

export default AppHeader;
