import { Link } from "@remix-run/react";
import type { FC } from "react";

const HeaderContent: FC = () => {
  return (
    <div className="container remix-app__header-content">
      <Link to="/" title="Remix" className="remix-app__header-home-link">
        My App
      </Link>
      <nav aria-label="Main navigation" className="remix-app__header-nav">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <a href="https://remix.run/docs">Remix Docs</a>
          </li>
          <li>
            <a href="https://github.com/remix-run/remix">GitHub</a>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default HeaderContent;
