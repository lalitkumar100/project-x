import React, { useState, useRef } from 'react';
import axios from 'axios';
import { 
  Database, AlertTriangle, UploadCloud, 
  Trash2, RefreshCw, Layers, CheckCircle2 
} from 'lucide-react';
import SectionHeader from '@/components/SectionHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:6000';

const SystemSetupPage = () => {
  const [loadingAction, setLoadingAction] = useState(null);
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleAction = async (actionUrl, actionName) => {
    if (!confirm(`Are you sure you want to ${actionName}? This action cannot be undone.`)) {
      return;
    }

    setLoadingAction(actionUrl);
    try {
      const response = await axios.post(`${BACKEND_URL}/v1/api/setup/${actionUrl}`);
      toast.success(response.data.message || `${actionName} completed successfully`);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${actionName}`);
      console.error(error);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a CSV file first");
      return;
    }

    setLoadingAction('import');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${BACKEND_URL}/v1/api/setup/import-items-csv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(response.data.message || `Successfully imported ${response.data.count || 0} items!`);
      setFile(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to import items");
      console.error(error);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      <SectionHeader 
        title="System Setup & Data Management" 
        description="Manage your database schema and bulk import inventory data."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* DATABASE OPERATIONS */}
        <Card className="border-cyan-100 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-600" />
              Database Operations
            </CardTitle>
            <CardDescription>
              Perform dangerous schema and data wiping operations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                These actions will permanently delete data from your system.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="w-full justify-start text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                onClick={() => handleAction('clear-data', 'Clear All Data')}
                disabled={loadingAction !== null}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {loadingAction === 'clear-data' ? 'Processing...' : 'Clear Data Only'}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={() => handleAction('drop-schema', 'Drop Schema')}
                disabled={loadingAction !== null}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                {loadingAction === 'drop-schema' ? 'Processing...' : 'Drop Schema'}
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start text-cyan-700 border-cyan-200 hover:bg-cyan-50"
                onClick={() => handleAction('add-schema', 'Add Schema')}
                disabled={loadingAction !== null}
              >
                <Layers className="w-4 h-4 mr-2" />
                {loadingAction === 'add-schema' ? 'Processing...' : 'Add Schema'}
              </Button>

              <Button 
                variant="default" 
                className="w-full justify-start bg-red-600 hover:bg-red-700 text-white"
                onClick={() => handleAction('reset-all', 'Full Reset')}
                disabled={loadingAction !== null}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {loadingAction === 'reset-all' ? 'Processing...' : 'Full Reset'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* BULK IMPORT */}
        <Card className="border-cyan-100 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-cyan-600" />
              Bulk Import Items (CSV)
            </CardTitle>
            <CardDescription>
              Upload a CSV file to bulk import inventory items. Brands and categories will be created automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="bg-slate-100 p-3 rounded-md text-xs text-slate-600 font-mono overflow-x-auto">
              <span className="font-semibold text-slate-800">Required Headers:</span><br/>
              Item Name,Brand Name,Category Name,Subcategory Name,Quantity,Reorder Level,MRP,Net Buy Price,Warranty Months,Description
            </div>

            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging ? 'border-cyan-500 bg-cyan-50' : 'border-slate-300 hover:bg-slate-50 hover:border-cyan-300'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                  <p className="font-medium text-slate-700">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                  <Badge variant="secondary" className="mt-2" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                    Remove File
                  </Badge>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <UploadCloud className="w-10 h-10 text-slate-400" />
                  <p className="font-medium text-slate-700">Click or drag CSV file here</p>
                  <p className="text-xs text-slate-500">Only .csv files are supported</p>
                </div>
              )}
            </div>

          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-cyan-600 hover:bg-cyan-700" 
              onClick={handleImport}
              disabled={!file || loadingAction !== null}
            >
              {loadingAction === 'import' ? 'Importing Data...' : 'Start Import'}
            </Button>
          </CardFooter>
        </Card>

      </div>
    </div>
  );
};

export default SystemSetupPage;
