import { useState, useEffect } from 'react';
import { AlertTriangle, Bell, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, parseISO } from 'date-fns';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DueBill {
  id: string;
  purchaseId: string;
  supplierName: string;
  total: number;
  paidAmount: number;
  remaining: number;
  purchaseDate: Date;
  daysSincePurchase: number;
  urgency: 'critical' | 'warning' | 'info';
}

export function DueBillsAlert() {
  const [dueBills, setDueBills] = useState<DueBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDueBills = async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          id,
          purchase_id,
          total,
          paid_amount,
          payment_status,
          purchase_date,
          suppliers (name)
        `)
        .in('payment_status', ['pending', 'partial'])
        .order('purchase_date', { ascending: true });

      if (!error && data) {
        const today = new Date();
        const bills: DueBill[] = data.map((p) => {
          const purchaseDate = parseISO(p.purchase_date);
          const daysSincePurchase = differenceInDays(today, purchaseDate);
          const remaining = p.total - p.paid_amount;
          
          let urgency: 'critical' | 'warning' | 'info' = 'info';
          if (daysSincePurchase >= 30) {
            urgency = 'critical';
          } else if (daysSincePurchase >= 14) {
            urgency = 'warning';
          }

          return {
            id: p.id,
            purchaseId: p.purchase_id,
            supplierName: p.suppliers?.name || 'Tidak diketahui',
            total: p.total,
            paidAmount: p.paid_amount,
            remaining,
            purchaseDate,
            daysSincePurchase,
            urgency,
          };
        });

        // Sort by urgency (critical first) then by days since purchase
        const sortedBills = bills.sort((a, b) => {
          const urgencyOrder = { critical: 0, warning: 1, info: 2 };
          if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
            return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
          }
          return b.daysSincePurchase - a.daysSincePurchase;
        });

        setDueBills(sortedBills);
      }
      setIsLoading(false);
    };

    fetchDueBills();
  }, []);

  if (isLoading || dueBills.length === 0) {
    return null;
  }

  const criticalCount = dueBills.filter(b => b.urgency === 'critical').length;
  const warningCount = dueBills.filter(b => b.urgency === 'warning').length;
  const totalUnpaid = dueBills.reduce((sum, b) => sum + b.remaining, 0);

  const getUrgencyStyles = (urgency: 'critical' | 'warning' | 'info') => {
    switch (urgency) {
      case 'critical':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'warning':
        return 'bg-warning/10 text-warning border-warning/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getUrgencyBadge = (urgency: 'critical' | 'warning' | 'info') => {
    switch (urgency) {
      case 'critical':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive text-destructive-foreground">Kritis</span>;
      case 'warning':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning text-warning-foreground">Segera</span>;
      default:
        return null;
    }
  };

  return (
    <div className="glass rounded-xl p-6 border border-warning/30 animate-slide-up" style={{ animationDelay: '550ms' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Tagihan Belum Lunas</h3>
            <p className="text-sm text-muted-foreground">
              {dueBills.length} tagihan • Total: Rp {totalUnpaid.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/purchases')}
          className="text-muted-foreground hover:text-foreground"
        >
          Lihat Semua
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Summary badges */}
      {(criticalCount > 0 || warningCount > 0) && (
        <div className="flex gap-2 mb-4">
          {criticalCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
              <AlertTriangle className="w-3 h-3" />
              {criticalCount} sudah &gt;30 hari
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium">
              <AlertTriangle className="w-3 h-3" />
              {warningCount} sudah &gt;14 hari
            </div>
          )}
        </div>
      )}

      {/* Bills list */}
      <div className="space-y-2">
        {dueBills.slice(0, 4).map((bill) => (
          <div 
            key={bill.id} 
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border",
              getUrgencyStyles(bill.urgency)
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground text-sm truncate">{bill.purchaseId}</p>
                {getUrgencyBadge(bill.urgency)}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {bill.supplierName} • {format(bill.purchaseDate, 'dd MMM yyyy', { locale: localeId })}
              </p>
            </div>
            <div className="text-right shrink-0 ml-3">
              <p className="font-semibold text-foreground text-sm">
                Rp {bill.remaining.toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-muted-foreground">
                {bill.daysSincePurchase} hari lalu
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
