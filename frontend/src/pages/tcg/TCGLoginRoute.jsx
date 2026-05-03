/**
 * TCGLoginRoute
 * When the user navigates to /admin/tcg/login, this component
 * automatically opens the TCG login dialog and redirects back
 * to the previous page (or /dashboard) after close.
 *
 * Usage: import this as the element for the /admin/tcg/login route.
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTCGLogin } from "@/context/TCGLoginContext";

export default function TCGLoginRoute() {
  const { openTCGLogin, isOpen, closeTCGLogin } = useTCGLogin();
  const navigate = useNavigate();

  /* Open dialog as soon as this route mounts */
  useEffect(() => {
    openTCGLogin();
  }, [openTCGLogin]);

  /* When dialog is closed, go back */
  useEffect(() => {
    if (!isOpen) {
      navigate(-1);            // go back to wherever they came from
    }
  }, [isOpen, navigate]);

  return null;  // renders nothing — the dialog is in MainLayout
}
