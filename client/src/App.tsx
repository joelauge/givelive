import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import JourneyBuilder from './pages/JourneyBuilder';
import Layout from './components/Layout';

import Home from './pages/Home';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import MailInbox from './pages/MailInbox';
import Privacy from './pages/Privacy';
import TermsOfService from './pages/TermsOfService';
import BlogIndex from './pages/BlogIndex';
import BlogPost from './pages/BlogPost';
import HowTo from './pages/HowTo';
import Pricing from './pages/Pricing';
import UseCaseIndex from './pages/UseCaseIndex';
import UseCasePage from './pages/UseCasePage';
import ArticlePage from './pages/ArticlePage';
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/blog" element={<BlogIndex />} />
        <Route path="/blog/articles/:slug" element={<ArticlePage />} />
        <Route path="/blog/:templateId" element={<BlogPost />} />
        <Route path="/use-cases" element={<UseCaseIndex />} />
        <Route path="/use-cases/:slug" element={<UseCasePage />} />
        <Route path="/how-to" element={<HowTo />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/template-preview/:templateId" element={<JourneyBuilder previewMode={true} />} />
        <Route
          path="/admin"
          element={
            <>
              <SignedIn>
                <AdminDashboard />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
      </Route>
      <Route path="/event/:eventId" element={<LandingPage />} />
      <Route
        path="/admin/event/:eventId"
        element={
          <>
            <SignedIn>
              <JourneyBuilder />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        }
      />
      <Route
        path="/settings"
        element={
          <>
            <SignedIn>
              <Settings />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        }
      />
      <Route
        path="/analytics"
        element={
          <>
            <SignedIn>
              <Analytics />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        }
      />
      <Route
        path="/mail"
        element={
          <>
            <SignedIn>
              <MailInbox />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        }
      />
      <Route
        path="/analytics/:eventId"
        element={
          <>
            <SignedIn>
              <Analytics />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        }
      />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/tos" element={<TermsOfService />} />
    </Routes>
  );
}

export default App;
