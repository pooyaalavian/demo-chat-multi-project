import { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import './App.css';
import { TopicHome } from './pages/topics/Topic';
import { SingleTopic } from './pages/topics/SingleTopic';
import { SingleThread } from './pages/threads/SingleThread';
import { SingleFile } from './pages/files/SingleFile';
import { NewTopic } from './pages/topics/NewTopic';
import { NewThread } from './pages/threads/NewThread';
import { NewFile } from './pages/files/NewFile';
import { NewUser } from './pages/users/NewUser';

function HomePage() {

  let navigate = useNavigate();
  useEffect(() => {
    navigate('/topics');
  }, [navigate]);

  return null;
}

function App() {
  return (
    <>
      <Router>
        <div className="flex flex-col h-full min-h-screen">
          <div id="header" className="flex-0 bg-blue-100">
            <div className="h1 text-2xl p-2">
              <Link to="/">Pooya's Demo Chat</Link>
            </div>
          </div>
          <div id="content" className="flex-auto h-full p-2 flex flex-col">
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
          <div id="footer" className="flex-0 h-4 bg-gray-500 text-white overflow-hidden">footer</div>
        </div>
      </Router>
    </>
  )
}

export default App
