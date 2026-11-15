/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { CoursesView } from './components/CoursesView';
import { CourseDetailView } from './components/CourseDetailView';
import { ExamsView } from './components/ExamsView';
import { ExamRunnerView } from './components/ExamRunnerView';
import { ReportCardView } from './components/ReportCardView';
import { BookletsView } from './components/BookletsView';
import { ArticlesView } from './components/ArticlesView';
import { LiveClassroomView } from './components/LiveClassroomView';
import { StudentPanelView } from './components/StudentPanelView';
import { AdminPanelView } from './components/AdminPanelView';
import { CartDrawer } from './components/CartDrawer';
import { ToastContainer } from './components/ToastContainer';
import { Footer } from './components/Footer';

const AppShell: React.FC = () => {
  const { view } = useApp();

  const renderView = () => {
    switch (view) {
      case 'home':
        return <HomeView />;
      case 'courses':
        return <CoursesView />;
      case 'course-detail':
        return <CourseDetailView />;
      case 'exams':
        return <ExamsView />;
      case 'exam-runner':
        return <ExamRunnerView />;
      case 'report-card':
        return <ReportCardView />;
      case 'booklets':
        return <BookletsView />;
      case 'articles':
        return <ArticlesView />;
      case 'live-classroom':
        return <LiveClassroomView />;
      case 'student-panel':
        return <StudentPanelView />;
      case 'admin-panel':
        return <AdminPanelView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Navbar />
      <main className="flex-1">{renderView()}</main>
      <Footer />
      <CartDrawer />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
