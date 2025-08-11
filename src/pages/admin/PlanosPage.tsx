import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingScreen from '../../components/ui/LoadingScreen';

interface UserPlan {
  user_id: string;
  plan_type: string;
  subscription_plan_name: string;
  companies_per_month_limit: string;
  companies_per_day_limit: string;
  subscription_plan_id: string;
  email?: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  limits: any;
}

const PlanosPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [users, setUsers] = useState<UserPlan[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingPlan, setChangingPlan] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadUsersAndPlans();
    }
  }, [isAuthenticated]);

  const loadUsersAndPlans = async () => {
    try {
      setLoading(true);
      
      // Carregar usuários e seus planos
      const { data: usersData, error: usersError } = await supabase
        .from('user_plans')
        .select(`
          user_id,
          plan_type,
          subscription_plan_id
        `);

      if (usersError) throw usersError;

      // Carregar planos disponíveis
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true);

      if (plansError) throw plansError;

      setPlans(plansData || []);

      // Buscar emails dos usuários
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) throw authError;

      // Combinar dados
      const usersWithPlans = (usersData || []).map(userPlan => {
        const authUser = authUsers.users.find(u => u.id === userPlan.user_id);
        const plan = plansData?.find(p => p.id === userPlan.subscription_plan_id);
        
        return {
          ...userPlan,
          email: authUser?.email || 'N/A',
          subscription_plan_name: plan?.name || 'N/A',
          companies_per_month_limit: plan?.limits?.companies_per_month || 'N/A',
          companies_per_day_limit: plan?.limits?.companies_per_day || 'N/A'
        };
      });

      setUsers(usersWithPlans);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeUserPlan = async (userId: string, planName: string) => {
    try {
      setChangingPlan(userId);
      
      const { data, error } = await supabase.rpc('change_user_plan', {
        p_user_id: userId,
        p_plan_name: planName
      });

      if (error) throw error;

      if (data?.success) {
        // Recarregar dados
        await loadUsersAndPlans();
        alert(`Plano alterado para ${planName} com sucesso!`);
      } else {
        alert(`Erro: ${data?.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao alterar plano:', error);
      alert(`Erro ao alterar plano: ${error}`);
    } finally {
      setChangingPlan(null);
    }
  };

  if (loading) {
    return <LoadingScreen page="default" />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Gerenciar Planos dos Usuários
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Altere os planos dos usuários e monitore o uso
        </p>
      </div>

      {/* Planos Disponíveis */}
      <Card className="mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Planos Disponíveis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {plan.description}
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  R$ {plan.price}
                </p>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>Empresas: {plan.limits?.companies_per_month || plan.limits?.companies_per_day}</p>
                  <p>Disparos: {plan.limits?.dispatches_per_month || plan.limits?.dispatches_per_day}</p>
                  <p>Conexões: {plan.limits?.whatsapp_connections}</p>
                  <p>Templates: {plan.limits?.templates}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Lista de Usuários */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Usuários e Seus Planos
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Plano Atual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Limite Empresas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((userPlan) => (
                  <tr key={userPlan.user_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {userPlan.email}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {userPlan.user_id.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        userPlan.plan_type === 'premium' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : userPlan.plan_type === 'basic'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {userPlan.subscription_plan_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {userPlan.companies_per_month_limit !== 'N/A' 
                        ? `${userPlan.companies_per_month_limit}/mês`
                        : userPlan.companies_per_day_limit !== 'N/A'
                        ? `${userPlan.companies_per_day_limit}/dia`
                        : 'N/A'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {plans.map((plan) => (
                          <Button
                            key={plan.id}
                            onClick={() => changeUserPlan(userPlan.user_id, plan.name)}
                            disabled={changingPlan === userPlan.user_id || userPlan.subscription_plan_name === plan.name}
                            className={`text-xs px-3 py-1 ${
                              userPlan.subscription_plan_name === plan.name
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : plan.name === 'Premium'
                                ? 'bg-purple-600 hover:bg-purple-700'
                                : plan.name === 'Básico'
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : 'bg-gray-600 hover:bg-gray-700'
                            }`}
                          >
                            {changingPlan === userPlan.user_id && userPlan.subscription_plan_name !== plan.name
                              ? 'Alterando...'
                              : plan.name
                            }
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PlanosPage; 