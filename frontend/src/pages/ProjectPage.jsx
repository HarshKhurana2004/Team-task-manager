import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject, getTasks, getStats, createTask, updateTask, deleteTask, addMember, removeMember } from '../api';
import { useAuth } from '../AuthContext';

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};
const STATUS_COLORS = {
  todo: 'bg-gray-100 text-gray-700',
  inprogress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
};
const STATUS_LABELS = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' };

export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [myRole, setMyRole] = useState('member');
  const [tab, setTab] = useState('tasks');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  // Task form state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', dueDate: '', priority: 'medium', assignedTo: '' });

  // Member form
  const [memberEmail, setMemberEmail] = useState('');
  const [memberMsg, setMemberMsg] = useState('');

  useEffect(() => { fetchAll(); }, [id]);

  const fetchAll = async () => {
    try {
      const [pRes, tRes, sRes] = await Promise.all([getProject(id), getTasks(id), getStats(id)]);
      setProject(pRes.data);
      setTasks(tRes.data);
      setStats(sRes.data);
      const me = pRes.data.members?.find(m => m.user?._id === user?.id || m.user?.id === user?.id);
      setMyRole(me?.role || 'member');
    } catch (err) {
      setError('Failed to load project');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await createTask({ ...taskForm, projectId: id, assignedTo: taskForm.assignedTo || null });
      setTaskForm({ title: '', description: '', dueDate: '', priority: 'medium', assignedTo: '' });
      setShowTaskForm(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create task');
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await updateTask(taskId, { status });
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTask(taskId);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to delete task');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setMemberMsg('');
    try {
      await addMember(id, { email: memberEmail, role: 'member' });
      setMemberEmail('');
      setMemberMsg('Member added!');
      fetchAll();
    } catch (err) {
      setMemberMsg(err.response?.data?.msg || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (uid) => {
    if (!confirm('Remove this member?')) return;
    try {
      await removeMember(id, uid);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to remove member');
    }
  };

  const isOverdue = (task) => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'mine') return t.assignedTo?._id === user?.id || t.assignedTo?.id === user?.id;
    return t.status === filter;
  });

  if (!project) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600 transition-colors">
            ← Back
          </button>
          <span className="text-gray-300">/</span>
          <span className="font-semibold text-gray-900">{project.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ml-2 ${myRole === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
            {myRole}
          </span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm flex justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-400">✕</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total || 0, color: 'text-gray-900' },
            { label: 'To Do', value: stats.todo || 0, color: 'text-gray-600' },
            { label: 'In Progress', value: stats.inprogress || 0, color: 'text-blue-600' },
            { label: 'Done', value: stats.done || 0, color: 'text-green-600' },
            { label: 'Overdue', value: stats.overdue || 0, color: 'text-red-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
          {['tasks', 'members'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Tasks Tab */}
        {tab === 'tasks' && (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              {/* Filter */}
              <div className="flex gap-2 flex-wrap">
                {['all', 'mine', 'todo', 'inprogress', 'done'].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                    {f === 'inprogress' ? 'In Progress' : f}
                  </button>
                ))}
              </div>
              {myRole === 'admin' && (
                <button onClick={() => setShowTaskForm(!showTaskForm)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  + Add Task
                </button>
              )}
            </div>

            {/* Task form */}
            {showTaskForm && myRole === 'admin' && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4">New Task</h3>
                <form onSubmit={handleCreateTask} className="space-y-3">
                  <input type="text" placeholder="Task title *" value={taskForm.title} required
                    onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <textarea placeholder="Description (optional)" value={taskForm.description}
                    onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                    rows={2}
                    className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Due Date</label>
                      <input type="date" value={taskForm.dueDate}
                        onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Priority</label>
                      <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Assign To</label>
                      <select value={taskForm.assignedTo} onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                        <option value="">Unassigned</option>
                        {project.members?.map(m => (
                          <option key={m.user?._id || m.user?.id} value={m.user?._id || m.user?.id}>
                            {m.user?.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                      Create Task
                    </button>
                    <button type="button" onClick={() => setShowTaskForm(false)}
                      className="bg-gray-100 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Task list */}
            <div className="space-y-3">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
                  No tasks found
                </div>
              ) : filteredTasks.map(task => (
                <div key={task._id}
                  className={`bg-white border rounded-xl p-4 ${isOverdue(task) ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>
                          {task.priority}
                        </span>
                        {isOverdue(task) && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">overdue</span>
                        )}
                      </div>
                      {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                        {task.assignedTo && <span>Assigned to: <span className="text-gray-600 font-medium">{task.assignedTo.name}</span></span>}
                        {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select value={task.status} onChange={e => handleStatusChange(task._id, e.target.value)}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium border-0 cursor-pointer ${STATUS_COLORS[task.status]}`}>
                        <option value="todo">To Do</option>
                        <option value="inprogress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                      {myRole === 'admin' && (
                        <button onClick={() => handleDeleteTask(task._id)}
                          className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none">
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Members Tab */}
        {tab === 'members' && (
          <div>
            {myRole === 'admin' && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3">Add Member</h3>
                <form onSubmit={handleAddMember} className="flex gap-2">
                  <input type="email" placeholder="Member email address" value={memberEmail} required
                    onChange={e => setMemberEmail(e.target.value)}
                    className="flex-1 border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  <button type="submit" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">
                    Add
                  </button>
                </form>
                {memberMsg && (
                  <p className={`text-sm mt-2 ${memberMsg.includes('!') ? 'text-green-600' : 'text-red-600'}`}>{memberMsg}</p>
                )}
              </div>
            )}

            <div className="space-y-3">
              {project.members?.map(m => (
                <div key={m.user?._id || m.user?.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
                      {m.user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{m.user?.name}</p>
                      <p className="text-xs text-gray-500">{m.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {m.role}
                    </span>
                    {myRole === 'admin' && m.role !== 'admin' && (
                      <button onClick={() => handleRemoveMember(m.user?._id || m.user?.id)}
                        className="text-gray-300 hover:text-red-400 text-lg leading-none ml-1">
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Per-user task stats */}
            {Object.keys(stats.perUser || {}).length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-800 mb-3 text-sm">Tasks per Member</h3>
                <div className="space-y-2">
                  {Object.entries(stats.perUser).map(([name, count]) => (
                    <div key={name} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
                      <span className="text-sm text-gray-700">{name}</span>
                      <span className="text-sm font-semibold text-blue-600">{count} task{count !== 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
