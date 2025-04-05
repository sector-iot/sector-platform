'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Copy, Trash2, Eye, EyeOff } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { Apikey } from '@repo/database';

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<Apikey[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await authClient.apiKey.list();
      if (error) throw error;
      if(data) setApiKeys(data.map(key => ({ 
        ...key, 
        key: key.start || '',
        permissions: key.permissions || null,
        metadata: key.metadata ? JSON.stringify(key.metadata) : null
      })));
    } catch (error) {
      toast.error('Failed to fetch API keys');
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key');
      return;
    }

    setIsLoading(true);
    try {
      const { data: apiKey, error } = await authClient.apiKey.create({
        name: newKeyName,
        prefix: 'app',
      });

      if (error) throw error;
      
      setNewApiKey(apiKey.key || '');
      setNewKeyName('');
      toast.success('API key created successfully');
    } catch (error) {
      toast.error('Failed to create API key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    try {
      const { error } = await authClient.apiKey.delete({
        keyId: id
      });
      if (error) throw error;
      
      setApiKeys((prev) => prev.filter((key) => key.id !== id));
      toast.success('API key deleted successfully');
    } catch (error) {
      toast.error('Failed to delete API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('API key copied to clipboard');
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">API Keys</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          Create API Key
        </Button>
      </div>

      <div className="grid gap-4">
        {apiKeys.map((apiKey) => (
          <Card key={apiKey.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{apiKey.name}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDeleteApiKey(apiKey.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Prefix: {apiKey.prefix}
                </p>
                <p className="text-sm text-muted-foreground">
                  Created: {new Date(apiKey.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New API Key</DialogTitle>
            <DialogDescription>
              {newApiKey ? (
                <>
                  <p className="text-red-500 mb-4">
                    ⚠️ Please copy your API key now. You won't be able to see it again!
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      type={showKey ? "text" : "password"}
                      value={newApiKey}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(newApiKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    className="w-full mt-4"
                    onClick={() => {
                      setNewApiKey(null);
                      setIsCreateDialogOpen(false);
                      fetchApiKeys();
                    }}
                  >
                    Done
                  </Button>
                </>
              ) : (
                <>
                  <p className="mb-4">
                    Enter a name for your new API key. You'll be able to see and copy the key only once after creation.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter API key name"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                    <Button onClick={handleCreateApiKey} disabled={isLoading}>
                      {isLoading ? 'Creating...' : 'Create'}
                    </Button>
                  </div>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
