import { createBrowserRouter } from "react-router-dom";
import AppLayout from "@/layouts/Layout";
import RootPage from "@/pages/Root";
import ErrorFallback from "@/components/error";
import TestPage from "@/pages/test";
import RequireAuth from "@/components/auth/require-auth";
import Login from "@/pages/login";
import MembersPage from "@/pages/members";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <RootPage /> },
          { path: "members", element: <MembersPage /> },
          { path: "test", element: <TestPage /> },
        ],
      },
    ],
  },

  { path: "*", element: <ErrorFallback /> },
]);

export default router;
