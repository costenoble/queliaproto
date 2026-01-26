
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, LogOut, Loader2, AlertTriangle, ChevronLeft, ChevronRight, Building2, MapPin, Shield } from 'lucide-react';
import ProjectModal from '@/components/ProjectModal';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';

// Components
import ProjectsTable from '@/components/Admin/ProjectsTable';
import SearchBar from '@/components/Admin/SearchBar';
import DeleteConfirmationModal from '@/components/Admin/DeleteConfirmationModal';
import ClientsManagement from '@/components/Admin/ClientsManagement';

const ITEMS_PER_PAGE = 10;

const AdminPage = () => {
  const { logout, currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Tab state (pour super_admin)
  const [activeTab, setActiveTab] = useState('projects');

  // Data State
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stats
  const [stats, setStats] = useState({ totalProjects: 0, totalClients: 0 });

  // Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClientId, setFilterClientId] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(id, name, slug, logo_url, primary_color)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Impossible de charger les projets.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, slug')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error("Error fetching clients:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const { count: projectCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

      const { count: clientCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalProjects: projectCount || 0,
        totalClients: clientCount || 0
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchClients();
    fetchStats();

    const channel = supabase
      .channel('table-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        () => {
          fetchProjects();
          fetchStats();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        () => {
          fetchClients();
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter Logic
  const filteredProjects = useMemo(() => {
    let result = projects;

    if (filterClientId !== 'all') {
      result = result.filter(p => p.client_id === filterClientId);
    }

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(p =>
        (p.name && p.name.toLowerCase().includes(lowerTerm)) ||
        (p.city && p.city.toLowerCase().includes(lowerTerm)) ||
        (p.type && p.type.toLowerCase().includes(lowerTerm)) ||
        (p.status && p.status.toLowerCase().includes(lowerTerm)) ||
        (p.client?.name && p.client.name.toLowerCase().includes(lowerTerm))
      );
    }

    return result;
  }, [projects, searchTerm, filterClientId]);

  // Sort Logic
  const sortedProjects = useMemo(() => {
    let sortableItems = [...filteredProjects];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key] || '';
        const valB = b[sortConfig.key] || '';

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredProjects, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedProjects.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedProjects, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterClientId]);

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleCreate = () => {
    setSelectedProject(null);
    setIsModalOpen(true);
  };

  const handleEdit = (project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectToDelete.id);

      if (error) throw error;
      toast({ title: "Projet supprime", description: "Le projet a ete supprime avec succes." });
    } catch (err) {
      console.error("Delete error:", err);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer le projet." });
    } finally {
      setProjectToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Helmet>
        <title>Administration Quelia</title>
      </Helmet>

      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-900 to-blue-800 shadow-lg text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  ADMIN
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight">
                  Administration Quelia
                </h1>
              </div>
              <p className="mt-1 text-indigo-200 text-sm font-medium">
                Connecte en tant que{' '}
                <span className="text-white bg-white/20 px-2 py-0.5 rounded-full ml-1">
                  {userProfile?.full_name || currentUser?.email}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleCreate}
                className="bg-white text-indigo-900 hover:bg-gray-100 font-bold border-0 shadow-md transition-all hover:scale-105"
              >
                <Plus className="w-5 h-5 mr-2" />
                Nouveau Projet
              </Button>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Deconnexion
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === 'projects'
                  ? 'bg-white text-indigo-900'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Projets ({stats.totalProjects})
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === 'clients'
                  ? 'bg-white text-indigo-900'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Clients ({stats.totalClients})
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full -mt-4">
        {activeTab === 'clients' ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <ClientsManagement />
          </div>
        ) : (
          <>
            {/* Stats / Filter Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-50 p-3 rounded-full">
                    <span className="text-2xl font-bold text-indigo-700 block leading-none">
                      {filteredProjects.length}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">
                      Total Projets
                    </p>
                    <p className="text-xs text-gray-400">Base de donnees active</p>
                  </div>
                </div>

                {clients.length > 0 && (
                  <div className="hidden md:block">
                    <select
                      value={filterClientId}
                      onChange={(e) => setFilterClientId(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="all">Tous les clients</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="w-full md:w-1/2 lg:w-1/3">
                <SearchBar
                  value={searchTerm}
                  onChange={setSearchTerm}
                  count={filteredProjects.length}
                />
              </div>
            </div>

            {/* Content Area */}
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex flex-col justify-center items-center h-64 bg-white rounded-xl shadow-sm border border-gray-100">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                  <p className="text-gray-500 font-medium">Chargement des donnees...</p>
                </div>
              ) : error ? (
                <div className="p-12 text-center bg-white rounded-xl shadow-sm border border-red-100">
                  <div className="inline-block p-4 bg-red-50 rounded-full mb-4">
                    <AlertTriangle className="w-12 h-12 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Erreur de connexion</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">{error}</p>
                  <Button onClick={fetchProjects} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                    Reessayer
                  </Button>
                </div>
              ) : (
                <>
                  <ProjectsTable
                    projects={paginatedProjects}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    showClient={true}
                  />

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg shadow-sm">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          size="sm"
                        >
                          Precedent
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          size="sm"
                        >
                          Suivant
                        </Button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Affichage de <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> a{' '}
                            <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, sortedProjects.length)}</span> sur{' '}
                            <span className="font-medium">{sortedProjects.length}</span> resultats
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                            <button
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </button>

                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum = i + 1;
                              if (totalPages > 5 && currentPage > 3) {
                                pageNum = currentPage - 2 + i;
                                if (pageNum > totalPages) return null;
                              }
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    currentPage === pageNum
                                      ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}

                            <button
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              disabled={currentPage === totalPages}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </main>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        project={selectedProject}
        clients={clients}
        onSave={() => {
          fetchProjects();
          fetchStats();
          setIsModalOpen(false);
        }}
      />

      <DeleteConfirmationModal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={confirmDelete}
        projectName={projectToDelete?.name}
      />
    </div>
  );
};

export default AdminPage;
