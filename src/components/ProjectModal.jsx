
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ProjectForm from './ProjectForm';

const ProjectModal = ({ isOpen, onClose, project, onSave, clientId, clients }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* 
        Updated styling:
        - Pure white background (bg-white)
        - Max width increased to accommodate the side-by-side layout (sm:max-w-[1000px])
        - p-0 to allow header customization if needed, though we use standard p-6
      */}
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto bg-white p-0 border-0 shadow-2xl gap-0 block">
        <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10 flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold text-gray-900">
            {project ? 'Modifier le projet' : 'Ajouter un nouveau projet'}
          </DialogTitle>
          {/* Close button is handled automatically by DialogContent, but we ensure the header structure supports it visually */}
        </DialogHeader>
        
        <div className="p-6">
          <ProjectForm
            project={project}
            clientId={clientId}
            clients={clients}
            onSuccess={() => {
              onSave();
              onClose();
            }}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectModal;
