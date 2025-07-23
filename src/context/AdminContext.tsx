import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, Lead, Campaign, Company } from '../types';

interface AdminContextType {
  user: User | null;
  leads: Lead[];
  campaigns: Campaign[];
  companies: Company[];
  setUser: (user: User | null) => void;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateLead: (id: string, lead: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  addCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCampaign: (id: string, campaign: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const addLead = useCallback((leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newLead: Lead = {
      ...leadData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setLeads(prev => [newLead, ...prev]);
  }, []);

  const updateLead = useCallback((id: string, leadData: Partial<Lead>) => {
    setLeads(prev => prev.map(lead => 
      lead.id === id ? { ...lead, ...leadData, updatedAt: new Date() } : lead
    ));
  }, []);

  const deleteLead = useCallback((id: string) => {
    setLeads(prev => prev.filter(lead => lead.id !== id));
  }, []);

  const addCampaign = useCallback((campaignData: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCampaign: Campaign = {
      ...campaignData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setCampaigns(prev => [newCampaign, ...prev]);
  }, []);

  const updateCampaign = useCallback((id: string, campaignData: Partial<Campaign>) => {
    setCampaigns(prev => prev.map(campaign => 
      campaign.id === id ? { ...campaign, ...campaignData, updatedAt: new Date() } : campaign
    ));
  }, []);

  const deleteCampaign = useCallback((id: string) => {
    setCampaigns(prev => prev.filter(campaign => campaign.id !== id));
  }, []);

  return (
    <AdminContext.Provider
      value={{
        user,
        leads,
        campaigns,
        companies,
        setUser,
        addLead,
        updateLead,
        deleteLead,
        addCampaign,
        updateCampaign,
        deleteCampaign
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};