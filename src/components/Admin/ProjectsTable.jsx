
import { useState } from 'react';
import { Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Link2, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStatusColorClass } from '@/utils/mapUtils';
import { useToast } from '@/components/ui/use-toast';
import ApiKeyDisplay from './ApiKeyDisplay';

const SimpleTooltip = ({ text, children }) => {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span className="absolute bottom-full mb-2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white z-[100] pointer-events-none">
          {text}
          <span className="absolute top-full left-1/2 -ml-1 h-2 w-2 -translate-y-1 rotate-45 bg-gray-900"></span>
        </span>
      )}
    </div>
  );
};

const ProjectsTable = ({ projects, onEdit, onDelete, sortConfig, onSort, showClient = false }) => {
  const { toast } = useToast();

  const copyPoiLink = async (project) => {
    if (!project.client?.slug) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Ce projet n\'est pas associé à un client.' });
      return;
    }

    const url = `${window.location.origin}/carte/${project.client.slug}?poi=${project.id}`;

    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Lien carte copié', description: 'Le lien vers la carte avec ce POI a été copié.' });
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast({ title: 'Lien carte copié', description: 'Le lien vers la carte avec ce POI a été copié.' });
    }
  };

  const copyEmbedLink = async (project) => {
    const url = `${window.location.origin}/poi/${project.id}`;

    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Lien embed copié', description: 'Le lien vers la fiche POI a été copié.' });
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast({ title: 'Lien embed copié', description: 'Le lien vers la fiche POI a été copié.' });
    }
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="w-3 h-3 ml-1 text-indigo-600" /> : 
      <ArrowDown className="w-3 h-3 ml-1 text-indigo-600" />;
  };

  const handleSort = (key) => {
    onSort(key);
  };

  return (
    <div className="w-full rounded-xl border border-gray-200 shadow-sm bg-white">
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full whitespace-nowrap text-left text-sm">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-200">
              {showClient && (
                <th className="px-6 py-4 font-semibold text-gray-600">
                  CLIENT
                </th>
              )}
              <th
                className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors group select-none"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  PROJET {getSortIcon('name')}
                </div>
              </th>
              <th
                className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors select-none"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center">
                  TYPE {getSortIcon('type')}
                </div>
              </th>
              <th 
                className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors select-none"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  STATUT {getSortIcon('status')}
                </div>
              </th>
              <th
                className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors select-none"
                onClick={() => handleSort('city')}
              >
                <div className="flex items-center">
                  VILLE {getSortIcon('city')}
                </div>
              </th>
              <th className="px-6 py-4 font-semibold text-gray-600">
                CLÉ API
              </th>
              <th className="px-6 py-4 font-semibold text-gray-600 text-right">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.length === 0 ? (
              <tr>
                <td colSpan={showClient ? 7 : 6} className="px-6 py-12 text-center text-gray-500 italic">
                  Aucun projet trouvé
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr
                  key={project.id}
                  className="hover:bg-gray-50/80 transition-all duration-200 group"
                >
                  {showClient && (
                    <td className="px-6 py-4">
                      {project.client ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: project.client.primary_color || '#3b82f6' }}
                          >
                            {project.client.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-gray-700 text-sm">{project.client.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-sm">Non assigne</span>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {project.name}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                      {project.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColorClass(project.status)}`}>
                      <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${project.status?.includes('construction') ? 'bg-yellow-500' : project.status?.includes('étude') ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {project.city || <span className="text-gray-400 italic">Non spécifié</span>}
                  </td>
                  <td className="px-6 py-4">
                    <ApiKeyDisplay projectId={project.id} projectName={project.name} />
                  </td>
                  <td className="px-6 py-4 text-right overflow-visible">
                    <div className="flex justify-end gap-1 items-center">
                      {project.client?.slug && (
                        <SimpleTooltip text="Lien carte">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyPoiLink(project)}
                            className="h-8 w-8 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-all duration-200 hover:scale-110 hover:shadow-md"
                          >
                            <Link2 className="w-4 h-4" />
                          </Button>
                        </SimpleTooltip>
                      )}

                      <SimpleTooltip text="Lien fiche POI">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyEmbedLink(project)}
                          className="h-8 w-8 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all duration-200 hover:scale-110 hover:shadow-md"
                        >
                          <Square className="w-4 h-4" />
                        </Button>
                      </SimpleTooltip>

                      <span className="w-px h-6 bg-gray-200 mx-1"></span>

                      <SimpleTooltip text="Modifier">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(project)}
                          className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-full transition-all duration-200 hover:scale-110 hover:shadow-md"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </SimpleTooltip>

                      <SimpleTooltip text="Supprimer">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(project)}
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200 hover:scale-110 hover:shadow-md"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </SimpleTooltip>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectsTable;
