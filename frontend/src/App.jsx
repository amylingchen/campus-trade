import { Navigate, Route, Routes } from "react-router-dom";
import AuthGuard from "./components/AuthGuard.jsx";
import AppShell from "./components/AppShell.jsx";
import HomePage from "./pages/HomePage.jsx";
import MarketplacePage from "./pages/MarketplacePage.jsx";
import ListingDetailPage from "./pages/ListingDetailPage.jsx";
import ListingFormPage from "./pages/ListingFormPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import VerifySchoolPage from "./pages/VerifySchoolPage.jsx";
import CoursesPage from "./pages/CoursesPage.jsx";
import ChatsPage from "./pages/ChatsPage.jsx";
import ChatDetailPage from "./pages/ChatDetailPage.jsx";
import AccountPage from "./pages/AccountPage.jsx";
import FavoritesPage from "./pages/FavoritesPage.jsx";
import MyListingsPage from "./pages/MyListingsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/verify-school" element={<AuthGuard><VerifySchoolPage /></AuthGuard>} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/listings/new" element={<AuthGuard requireVerified><ListingFormPage mode="create" /></AuthGuard>} />
        <Route path="/listings/:id" element={<ListingDetailPage />} />
        <Route path="/listings/:id/edit" element={<AuthGuard requireVerified><ListingFormPage mode="edit" /></AuthGuard>} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:courseCode" element={<MarketplacePage courseRoute />} />
        <Route path="/chats" element={<AuthGuard requireVerified><ChatsPage /></AuthGuard>} />
        <Route path="/chats/:id" element={<AuthGuard requireVerified><ChatDetailPage /></AuthGuard>} />
        <Route path="/me" element={<AuthGuard><AccountPage /></AuthGuard>} />
        <Route path="/me/listings" element={<AuthGuard requireVerified><MyListingsPage /></AuthGuard>} />
        <Route path="/me/favorites" element={<AuthGuard requireVerified><FavoritesPage /></AuthGuard>} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
