
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle } from 'lucide-react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, projectName }) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md mx-auto rounded-xl border-0 shadow-2xl bg-white p-0 overflow-hidden">
        <div className="bg-red-50 p-6 flex flex-col items-center justify-center border-b border-red-100">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <Trash2 className="h-8 w-8 text-red-600" />
          </div>
          <AlertDialogTitle className="text-xl font-bold text-gray-900 text-center">
            Supprimer ce projet ?
          </AlertDialogTitle>
        </div>
        
        <div className="p-6">
          <AlertDialogDescription className="text-center text-gray-600 mb-6 text-base">
            Vous êtes sur le point de supprimer le projet <span className="font-bold text-gray-900">"{projectName}"</span>.
            <br />
            <span className="inline-flex items-center justify-center mt-2 text-sm text-red-600 bg-red-50 py-1 px-3 rounded-full">
              <AlertTriangle className="w-3 h-3 mr-1 inline" /> Cette action est irréversible
            </span>
          </AlertDialogDescription>

          <AlertDialogFooter className="sm:justify-center gap-3 w-full">
            <AlertDialogCancel className="mt-0 w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 font-medium transition-colors">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={onConfirm} 
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmationModal;
