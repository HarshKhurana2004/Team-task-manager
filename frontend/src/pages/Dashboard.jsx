import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects, createProject, deleteProject } from '../api';
import { useAuth } from '../AuthContext';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(res.data);
    } catch (err) {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createProject({ name: newName, description: newDesc });
      setNewName(''); setNewDesc(''); setShowForm(false);
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create project');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this project?')) return;
    try {
      await deleteProject(id);
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to delete project');
    }
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
  const colors = ['bg-blue-500','bg-purple-500','bg-green-500','bg-yellow-500','bg-pink-500','bg-indigo-500'];
  const getColor = (name) => colors[name?.charCodeAt(0) % colors.length] || colors[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">T</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">TaskManager</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full ${getColor(user?.name)} flex items-center justify-center text-white text-xs font-medium`}>
                {getInitials(user?.name)}
              </div>
              <span className="text-gray-700 text-sm font-medium hidden sm:block">{user?.name}</span>
            </div>
            <button onClick={logout} className="text-sm text-gray-500 hover:text-red-500 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
            <p className="text-gray-500 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            + New Project
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-4">Create New Project</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input type="text" placeholder="Project name *" value={newName} required
                onChange={e => setNewName(e.target.value)}
                className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="Description (optional)" value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex gap-2">
                <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                  Create
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="bg-gray-100 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Projects grid */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-400 text-lg mb-2">No projects yet</p>
            <p className="text-gray-400 text-sm">Click "New Project" to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => {
              const myRole = p.members?.find(m => m.user?._id === user?.id || m.user?.id === user?.id)?.role;
              return (
                <div key={p._id}
                  onClick={() => navigate(`/project/${p._id}`)}
                  className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg ${getColor(p.name)} flex items-center justify-center text-white font-bold`}>
                      {p.name[0]?.toUpperCase()}
                    </div>
                    {myRole === 'admin' && (
                      <button onClick={(e) => handleDelete(p._id, e)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded transition-all">
                        Delete
                      </button>
                    )}
                  </div>
                  <h2 className="font-semibold text-gray-900 mb-1">{p.name}</h2>
                  {p.description && <p className="text-gray-500 text-sm mb-3 line-clamp-2">{p.description}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">{p.members?.length} member{p.members?.length !== 1 ? 's' : ''}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${myRole === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {myRole}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
