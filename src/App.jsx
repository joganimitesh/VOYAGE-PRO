import React, { useState, useEffect, useCallback } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import apiClient, { BASE_URL } from "./api/apiClient";
import axios from "axios";
import { decodeJwt } from "./utils/helpers";
import { Toaster } from "react-hot-toast"; // ✅ Added Toaster

/* Layout & Pages */
import Layout from "./components/layout/Layout";
import HomePage from "./components/pages/HomePage";
import PackagesPage from "./components/pages/PackagesPage";
import AboutPage from "./components/pages/AboutPage";
import ContactPage from "./components/pages/ContactPage";
import PackageDetailsPage from "./components/pages/PackageDetailsPage";
import PaymentPage from "./components/pages/PaymentPage";
import MyBookingsPage from "./components/pages/MyBookingsPage";
import MyProfilePage from "./components/pages/MyProfilePage";
import LandingPage from "./components/auth/LandingPage";
import AdminLoginPage from "./components/auth/AdminLoginPage";
import UserLoginPage from "./components/auth/UserLoginPage";
import UserRegisterPage from "./components/auth/UserRegisterPage";
import AdminPage from "./components/admin/AdminPage";
import NotFoundPage from "./components/pages/NotFoundPage";
// ✅ --- START: NEW PAGE IMPORT ---
import BookingDetailsPage from "./components/pages/BookingDetailsPage";
import ItineraryBuilder from "./pages/ItineraryBuilder"; // ✅ New Import

// ✅ --- END: NEW PAGE IMPORT ---

/* Admin Pages */
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminPackagesPage from "./components/admin/AdminPackagesPage";
import AddPackagePage from "./components/admin/AddPackagePage";
import AdminRequestsPage from "./components/admin/AdminRequestsPage";
import AdminTeam from "./components/admin/AdminTeam";
import AdminResponses from "./components/admin/AdminResponses";
import AdminTransactionsPage from "./components/admin/AdminTransactionsPage";
import AdminUsersPage from "./components/admin/AdminUsersPage";

/* ===============================
🛡️ Protected Route Components
=============================== */
// ... (UserProtectedRoute and AdminProtectedRoute remain the same)
const UserProtectedRoute = ({ isUserAuthenticated, userProfile, children }) => {
  if (!isUserAuthenticated) return <Navigate to="/login" replace />;
  if (userProfile && userProfile.isBlocked) {
    alert("Your account has been blocked. Please contact support.");
    sessionStorage.removeItem("userAuthToken");
    return <Navigate to="/landing" replace />;
  }
  return children;
};
const AdminProtectedRoute = ({ isAdminAuthenticated, children }) => {
  if (!isAdminAuthenticated) return <Navigate to="/admin/login" replace />;
  return children;
};


/* ===============================
🌍 Main App Component
=============================== */
export default function App() {
  // ... (All state definitions remain the same)
  const navigate = useNavigate();
  const location = useLocation();
  const [packages, setPackages] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [savedPackageDetails, setSavedPackageDetails] = useState([]);
  const [likedPackageDetails, setLikedPackageDetails] = useState([]);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    !!sessionStorage.getItem("adminAuthToken")
  );
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(
    !!sessionStorage.getItem("userAuthToken")
  );
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingDataForPayment, setBookingDataForPayment] = useState(null);

  // ... (applyTheme and theme-switching useEffect remain the same)
  const applyTheme = useCallback((mode) => {
    const html = document.documentElement;
    html.classList.remove("light", "dark");
    html.classList.add(mode);
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith("/admin")) {
      const adminTheme =
        sessionStorage.getItem("voyage-admin-theme") || "light";
      applyTheme(adminTheme);
    } else {
      const userTheme =
        sessionStorage.getItem("voyage-user-theme") || "light";
      applyTheme(userTheme);
    }
  }, [location.pathname, applyTheme]);

  // ... (handleLogout and fetchUserProfile remain the same)
  const handleLogout = useCallback(
    (type = "user") => {
      if (type === "admin") {
        sessionStorage.removeItem("adminAuthToken");
        sessionStorage.setItem("voyage-admin-theme", "light");
        setIsAdminAuthenticated(false);
        navigate("/admin/login", { replace: true });
      } else {
        sessionStorage.removeItem("userAuthToken");
        const currentTheme =
          sessionStorage.getItem("voyage-user-theme") || "light";
        applyTheme(currentTheme);
        setIsUserAuthenticated(false);
        setUserProfile(null);
        navigate("/landing", { replace: true });
      }
    },
    [navigate, applyTheme]
  );

  const fetchUserProfile = useCallback(async () => {
    const token = sessionStorage.getItem("userAuthToken");
    if (!token) {
      setIsUserAuthenticated(false);
      setUserProfile(null);
      return;
    }
    try {
      const { data } = await apiClient.get("/profile");
      if (data.isBlocked) {
        alert("Your account has been blocked. Logging you out.");
        handleLogout("user");
      } else {
        setUserProfile(data);
        setIsUserAuthenticated(true);
      }
    } catch (error) {
      console.error("Session expired or invalid. Logging out.", error);
      handleLogout("user");
    }
  }, [handleLogout]);

  // ... (bootstrap and its useEffect remain the same)
  const bootstrap = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pkgsRes, testsRes, teamRes] = await Promise.all([
        apiClient.get("/packages"),
        apiClient.get("/testimonials"),
        apiClient.get("/team"),
      ]);
      setPackages(pkgsRes.data || []);
      setTestimonials(testsRes.data || []);
      setTeamMembers(teamRes.data.data || []);
      await fetchUserProfile();
      setIsAdminAuthenticated(!!sessionStorage.getItem("adminAuthToken"));
    } catch (err) {
      console.error("Bootstrap error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // ... (State Sync Effects for Saved and Liked packages remain the same)
  useEffect(() => {
    if (userProfile && userProfile.savedPackages && packages.length > 0) {
      const savedIds = new Set(userProfile.savedPackages);
      const details = packages.filter((pkg) => savedIds.has(pkg._id));
      setSavedPackageDetails(details);
    } else {
      setSavedPackageDetails([]);
    }
  }, [userProfile, packages]);

  useEffect(() => {
    if (userProfile && userProfile.likedPackages && packages.length > 0) {
      const likedIds = new Set(userProfile.likedPackages);
      const details = packages.filter((pkg) => likedIds.has(pkg._id));
      setLikedPackageDetails(details);
    } else {
      setLikedPackageDetails([]);
    }
  }, [userProfile, packages]);


  // ... (All Helper Functions remain the same)
  const handleUserLogin = async (token) => {
    sessionStorage.setItem("userAuthToken", token);
    await fetchUserProfile();
    navigate("/", { replace: true });
  };
  const handleAdminLogin = (token) => {
    sessionStorage.setItem("adminAuthToken", token);
    setIsAdminAuthenticated(true);
    navigate("/admin", { replace: true });
  };
  const handleProfileUpdate = (updatedProfile) => {
    setUserProfile(updatedProfile);
  };
  const handleProceedToPayment = (bookingData) => {
    setBookingDataForPayment(bookingData);
    navigate("/payment");
  };
  const handleAddRequest = async (finalBookingData) => {
    try {
      // ✅ FIX: Use direct axios call to bypass apiClient default headers
      // This ensures the browser sets the correct Content-Type with boundary for FormData
      const token = sessionStorage.getItem("userAuthToken");
      const { data } = await axios.post(`${BASE_URL}/api/requests/book`, finalBookingData, {
        headers: {
          "x-auth-token": token, // Manually attach token
          // Content-Type is intentionally omitted to let browser handle it
        },
      });
      return data;
    } catch (error) {
      console.error("Failed to submit booking:", error);
      throw error;
    }
  };
  const handleAddTestimonial = async (testimonialData) => {
    try {
      await apiClient.post("/testimonials/add", testimonialData);
      const testsRes = await apiClient.get("/testimonials");
      setTestimonials(testsRes.data || []);
    } catch (error) {
      console.error("Failed to add testimonial:", error);
    }
  };
  const findPackageById = (id) => packages.find((p) => p._id === id);
  const handleSavePackage = async (packageId) => {
    if (!isUserAuthenticated) {
      alert("Please log in to save packages.");
      navigate("/login");
      return;
    }
    try {
      const { data: updatedUser } = await apiClient.post(
        `/profile/save/${packageId}`
      );
      setUserProfile(updatedUser);
    } catch (error) {
      console.error("Failed to save package", error);
    }
  };
  const handleUnsavePackage = async (packageId) => {
    if (!isUserAuthenticated) return;
    try {
      const { data: updatedUser } = await apiClient.delete(
        `/profile/unsave/${packageId}`
      );
      setUserProfile(updatedUser);
    } catch (error) {
      console.error("Failed to unsave package", error);
    }
  };
  const handleLikePackage = async (packageId) => {
    if (!isUserAuthenticated) {
      alert("Please log in to like packages.");
      navigate("/login");
      return;
    }
    try {
      const { data: updatedUser } = await apiClient.post(
        `/profile/like/${packageId}`
      );
      setUserProfile(updatedUser);
    } catch (error) {
      console.error("Failed to like package", error);
    }
  };
  const handleUnlikePackage = async (packageId) => {
    if (!isUserAuthenticated) return;
    try {
      const { data: updatedUser } = await apiClient.delete(
        `/profile/unlike/${packageId}`
      );
      setUserProfile(updatedUser);
    } catch (error) {
      console.error("Failed to unlike package", error);
    }
  };


  /* ===============================
  ⏳ Loading Screen
  =============================== */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-brand border-r-transparent" />
      </div>
    );
  }

  /* ===============================
  🧭 Routes
  =============================== */
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>

          {/* 🌐 Main Layout Routes */}
          <Route
            element={
              <Layout
                userProfile={userProfile}
                handleLogout={handleLogout}
                isUserAuthenticated={isUserAuthenticated}
                isAdminAuthenticated={isAdminAuthenticated}
                currentUser={userProfile}
                applyTheme={applyTheme}
              />
            }
          >
            {/* ... (HomePage, PackagesPage, AboutPage, ContactPage, PackageDetailsPageWrapper, PaymentPage) */}
            <Route
              index
              element={
                <HomePage
                  packages={packages}
                  testimonials={testimonials}
                  handleAddTestimonial={handleAddTestimonial}
                  onViewDetails={(pkg) => navigate(`/packages/${pkg._id}`)}
                  currentUser={userProfile}
                  isUserAuthenticated={isUserAuthenticated}
                  handleSavePackage={handleSavePackage}
                  handleUnsavePackage={handleUnsavePackage}
                  handleLikePackage={handleLikePackage}
                  handleUnlikePackage={handleUnlikePackage}
                />
              }
            />
            <Route
              path="packages"
              element={
                <PackagesPage
                  packages={packages}
                  currentUser={userProfile}
                  handleSavePackage={handleSavePackage}
                  handleUnsavePackage={handleUnsavePackage}
                  handleLikePackage={handleLikePackage}
                  handleUnlikePackage={handleUnlikePackage}
                />
              }
            />
            <Route path="about" element={<AboutPage teamMembers={teamMembers} />} />
            <Route path="contact" element={<ContactPage />} />
            <Route
              path="packages/:id"
              element={
                <PackageDetailsPageWrapper
                  findPackageById={findPackageById}
                  handleProceedToPayment={handleProceedToPayment}
                  isUserAuthenticated={isUserAuthenticated}
                  currentUser={userProfile}
                  handleSavePackage={handleSavePackage}
                  handleUnsavePackage={handleUnsavePackage}
                  handleLikePackage={handleLikePackage}
                  handleUnlikePackage={handleUnlikePackage}
                />
              }
            />
            <Route
              path="payment"
              element={
                <UserProtectedRoute
                  isUserAuthenticated={isUserAuthenticated}
                  userProfile={userProfile}
                >
                  {bookingDataForPayment ? (
                    <PaymentPage
                      bookingData={bookingDataForPayment}
                      handleAddRequest={handleAddRequest}
                    />
                  ) : (
                    <Navigate to="/packages" replace />
                  )}
                </UserProtectedRoute>
              }
            />

            <Route
              path="my-profile"
              element={
                <UserProtectedRoute
                  isUserAuthenticated={isUserAuthenticated}
                  userProfile={userProfile}
                >
                  <MyProfilePage
                    onProfileUpdate={handleProfileUpdate}
                    currentUser={userProfile}
                    applyTheme={applyTheme}
                    handleLogout={handleLogout}
                    handleSavePackage={handleSavePackage}
                    handleUnsavePackage={handleUnsavePackage}
                    savedPackageDetails={savedPackageDetails}
                    handleLikePackage={handleLikePackage}
                    handleUnlikePackage={handleUnlikePackage}
                    likedPackageDetails={likedPackageDetails}
                  />
                </UserProtectedRoute>
              }
            />

            {/* This route is the "list" page */}
            <Route
              path="my-bookings"
              element={
                <UserProtectedRoute
                  isUserAuthenticated={isUserAuthenticated}
                  userProfile={userProfile}
                >
                  <MyBookingsPage />
                </UserProtectedRoute>
              }
            />

            {/* ✅ --- START: NEW BOOKING DETAILS ROUTE --- */}
            {/* This is the new "insights" page route */}
            <Route
              path="my-bookings/:bookingId"
              element={
                <UserProtectedRoute
                  isUserAuthenticated={isUserAuthenticated}
                  userProfile={userProfile}
                >
                  <BookingDetailsPage />
                </UserProtectedRoute>
              }
            />
            {/* ✅ --- END: NEW BOOKING DETAILS ROUTE --- */}

            {/* ✅ --- START: NEW ITINERARY BUILDER ROUTE --- */}
            <Route
              path="plan"
              element={
                <UserProtectedRoute
                  isUserAuthenticated={isUserAuthenticated}
                  userProfile={userProfile}
                >
                  <ItineraryBuilder />
                </UserProtectedRoute>
              }
            />
            {/* ✅ --- END: NEW ITINERARY BUILDER ROUTE --- */}

          </Route>

          {/* 🔐 Auth & Landing Routes */}
          {/* ... (Auth routes) ... */}
          <Route path="/landing" element={<LandingPage />} />
          <Route
            path="/login"
            element={<UserLoginPage handleUserLogin={handleUserLogin} />}
          />
          <Route path="/register" element={<UserRegisterPage />} />
          <Route
            path="/admin/login"
            element={<AdminLoginPage handleLogin={handleAdminLogin} />}
          />


          {/* 🧭 Admin Nested Routes */}
          {/* ... (Admin routes) ... */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute isAdminAuthenticated={isAdminAuthenticated}>
                <AdminPage
                  handleLogout={() => handleLogout("admin")}
                  applyTheme={applyTheme}
                />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="packages" element={<AdminPackagesPage />} />
            <Route path="packages/add" element={<AddPackagePage />} />
            <Route path="packages/edit/:id" element={<AddPackagePage />} />
            <Route path="requests" element={<AdminRequestsPage />} />
            <Route path="team" element={<AdminTeam />} />
            <Route path="responses" element={<AdminResponses />} />
            <Route path="transactions" element={<AdminTransactionsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>


          {/* ⚠️ Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

/* ===============================
📦 PackageDetailsPage Wrapper
=============================== */
// ... (This component remains the same)
const PackageDetailsPageWrapper = ({ findPackageById, ...props }) => {
  const { id } = useParams();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const foundPkg = findPackageById(id);
    if (foundPkg) {
      setPkg(foundPkg);
      setLoading(false);
    } else {
      apiClient
        .get(`/packages/${id}`)
        .then((res) => setPkg(res.data))
        .catch((err) => {
          console.error("Failed to fetch package", err);
          setError(true);
        })
        .finally(() => setLoading(false));
    }
  }, [id, findPackageById]);

  if (loading)
    return (
      <div className="min-h-screen pt-40 text-center">Loading package...</div>
    );

  if (error || !pkg) return <Navigate to="/404" replace />;

  return <PackageDetailsPage pkg={pkg} {...props} />;
};