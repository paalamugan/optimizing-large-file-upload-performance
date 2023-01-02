import type { LinksFunction, LoaderArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useCatch,
  useLoaderData,
  useLocation,
  useTransition,
} from "@remix-run/react";

import { getUser } from "./session.server";
import tailwindStylesheetUrl from "./styles/tailwind.min.css";
import React, { useEffect } from "react";
import NProgress from "nprogress";
import NProgressStyles from "nprogress/nprogress.css";

export const links: LinksFunction = () => {
  return [
    {
      rel: "preconnect",
      href: "//fonts.googleapis.com",
    },
    {
      rel: "preconnect",
      href: "//fonts.gstatic.com",
      crossOrigin: "anonymous",
    },
    {
      rel: "stylesheet",
      href: "//fonts.googleapis.com/css?family=Poppins:300,400,600,700&amp;lang=en",
    },
    { rel: "stylesheet", href: NProgressStyles },
    { rel: "stylesheet", href: tailwindStylesheetUrl },
  ];
};

// disable the loading spinner of nprogress
NProgress.configure({ showSpinner: false });

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Optimizing File Upload Performance Demo",
  description: "Learn how to optimize file upload performance with Remix.",
  viewport: "width=device-width,initial-scale=1",
});

export async function loader({ request }: LoaderArgs) {
  return json({
    user: await getUser(request),
    ENV: {},
  });
}

function Layout({ children }: React.PropsWithChildren<{}>) {
  return <div className="remix-root remix-app h-full">{children}</div>;
}

export default function App() {
  return (
    <Document>
      <Layout>
        <Outlet />
      </Layout>
    </Document>
  );
}

function InitialEnvLoaderData() {
  const data = useLoaderData<typeof loader>();
  return (
    data &&
    data.ENV && (
      <script
        dangerouslySetInnerHTML={{
          __html: `window.ENV = ${JSON.stringify(data.ENV)}`,
        }}
      />
    )
  );
}

function Document({
  children,
  title,
  isLoadEnv = true,
}: {
  children: React.ReactNode;
  title?: string;
  isLoadEnv?: boolean;
}) {
  // const matches = useMatches();
  // const useWhenSomethingIsTrue = matches.some(match => match.handle && match.handle?.something)

  const transition = useTransition();
  useEffect(() => {
    // when the state is idle then we can to complete the progress bar
    if (transition.state === "idle") NProgress.done();
    // and when it's something else it means it's either submitting a form or
    // waiting for the loaders of the next location so we start it
    else NProgress.start();
  }, [transition.state]);

  return (
    <html lang="en" className="h-full" data-theme="light">
      <head>
        {title ? <title>{title}</title> : null}
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        {children}
        <MemoRouteChangeAnnouncement />
        <ScrollRestoration />
        {isLoadEnv && <InitialEnvLoaderData />}
        <Scripts />
        {process.env.NODE_ENV === "development" && <LiveReload />}
      </body>
    </html>
  );
}

export function CatchBoundary() {
  let caught = useCatch();

  let message;
  switch (caught.status) {
    case 401:
      message = (
        <p>
          Oops! Looks like you tried to visit a page that you do not have access
          to.
        </p>
      );
      break;
    case 404:
      message = (
        <p>Oops! Looks like you tried to visit a page that does not exist.</p>
      );
      break;

    default:
      throw new Error(caught.data || caught.statusText);
  }

  return (
    <Document title={`${caught.status} ${caught.statusText}`}>
      <Layout>
        <h1>
          {caught.status}: {caught.statusText}
        </h1>
        {message}
      </Layout>
    </Document>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <Document title="Error!" isLoadEnv={false}>
      <Layout>
        <div>
          <h1>There was an error</h1>
          <p>{error.message}</p>
          <hr />
          <p>
            Hey, developer, you should replace this with what you want your
            users to see.
          </p>
        </div>
      </Layout>
    </Document>
  );
}

/**
 * Provides an alert for screen reader users when the route changes.
 */
function RouteChangeAnnouncement() {
  let [hydrated, setHydrated] = React.useState(false);
  let [innerHtml, setInnerHtml] = React.useState("");
  let location = useLocation();

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  let firstRenderRef = React.useRef(true);
  React.useEffect(() => {
    // Skip the first render because we don't want an announcement on the
    // initial page load.
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }

    let pageTitle = location.pathname === "/" ? "Home page" : document.title;
    setInnerHtml(`Navigated to ${pageTitle}`);
  }, [location.pathname]);

  // Render nothing on the server. The live region provides no value unless
  // scripts are loaded and the browser takes over normal routing.
  if (!hydrated) {
    return null;
  }

  return (
    <div
      aria-live="assertive"
      aria-atomic
      id="route-change-region"
      style={{
        border: "0",
        clipPath: "inset(100%)",
        clip: "rect(0 0 0 0)",
        height: "1px",
        margin: "-1px",
        overflow: "hidden",
        padding: "0",
        position: "absolute",
        width: "1px",
        whiteSpace: "nowrap",
        wordWrap: "normal",
      }}
    >
      {innerHtml}
    </div>
  );
}

const MemoRouteChangeAnnouncement = React.memo(RouteChangeAnnouncement);
