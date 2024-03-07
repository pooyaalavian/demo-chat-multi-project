import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';
import { TopicHome } from './pages/topics/Topic';
import { SingleTopic } from './pages/topics/SingleTopic';
import { SingleThread } from './pages/threads/SingleThread';
import { SingleFile } from './pages/files/SingleFile';
import { NewTopic } from './pages/topics/NewTopic';
import { NewThread } from './pages/threads/NewThread';
import { NewFile } from './pages/files/NewFile';
import { NewUser } from './pages/users/NewUser';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { Header } from './components/Header';
import Markdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import { wrappedFetch } from './api/internal';

declare const SERVER_VERSION: string;
declare const FRONTEND_VERSION: string;

function HomePage() {
  // const navigate = useNavigate();
  // useEffect(() => {
  //   navigate('/topics');
  // }, [navigate]);

  const [content, setContent] = useState<string>('');
  useEffect(() => {
    wrappedFetch<{ content: string }>('/settings/homepage', { method: 'GET' }).then((data) => setContent(data.content));
  }, []);


  return <section className="markdown-container">
    <div className="flex flex-col">
      <div className="flex-0">
        <div className="flex flex-row">
          <div className="flex-1"></div>
          <div className="flex-0">
            <Link to='/topics'>
              <div className='cursor-pointer rounded-lg border p-2 border-gray-800 hover:bg-blue-950 hover:text-white'> 
                Go to topics
              </div>
            </Link>
          </div>
        </div>
      </div>
      <div className="flex-1">
        <Markdown remarkPlugins={[remarkGfm]}>
          {content}
        </Markdown>
      </div>
    </div>
  </section>;
}

function App({ instance }: { instance: PublicClientApplication }) {
  return (
    <MsalProvider instance={instance}>
      <Router>
        <div className="flex flex-col h-screen">
          <div id="header" className="flex-0">
            <Header />
          </div>
          <div id="content" className="flex-auto overflow-auto p-2 flex flex-col">
            <Routes>
              <Route path="/topics/:topicId/files/new" element={<NewFile />} />
              <Route path="/topics/:topicId/files/:fileId" element={<SingleFile />} />
              <Route path="/topics/:topicId/threads/new" element={<NewThread />} />
              <Route path="/topics/:topicId/threads/:threadId" element={<SingleThread />} />
              <Route path="/topics/new" element={<NewTopic />} />
              <Route path="/topics/:topicId" element={<SingleTopic />} />
              <Route path="/topics" element={<TopicHome />} />
              <Route path="/users" element={<NewUser />} />
              <Route path="/" element={<HomePage />} />
            </Routes>
          </div>
          <div id="footer" className="flex-0 h-6 bg-gray-500 text-white overflow-hidden text-sm px-6">
            Server Version: {SERVER_VERSION} | Frontend Version: {FRONTEND_VERSION}
          </div>
        </div>
      </Router>
    </MsalProvider>
  )
}

export default App
