import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { logger } from '@/utils/logger';
import { 
  LogOut, 
  Scan, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  User, 
  QrCode, 
  History, 
  BarChart3, 
  Calendar,
  Users,
  FileText,
  Camera,
  Hand,
  TrendingUp,
  Clock,
  Shield,
  Info
} from 'lucide-react';

interface ScannerUser {
  id: string;
  username: string;
  full_name: string;
  is_active: boolean;
}

interface ScanResult {
  success: boolean;
  message: string;
  ticket_info?: {
    customer_name: string;
    ticket_type: string;
    match_info: string;
    match_date: string;
    quantity: number;
    scanned_at?: string;
  };
}

interface ScanHistoryItem {
  id: string;
  ticket_order_id: string;
  customer_name: string;
  ticket_type: string;
  match_info: string;
  quantity: number;
  scanned_at: string;
  status: 'success' | 'failed';
}

interface ScanStats {
  total_scans: number;
  successful_scans: number;
  today_scans: number;
  unique_customers: number;
}

export default function TicketScannerPage() {
  const [scannerUser, setScannerUser] = useState<ScannerUser | null>(null);
  const [ticketId, setTicketId] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [scanStats, setScanStats] = useState<ScanStats>({
    total_scans: 0,
    successful_scans: 0,
    today_scans: 0,
    unique_customers: 0
  });
  const [scanMethod, setScanMethod] = useState<'manual' | 'barcode'>('manual');
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const [barcodeSupported, setBarcodeSupported] = useState(true);
  const [lastScanTime, setLastScanTime] = useState(0);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('scanner_user');
    if (!userData) {
      navigate('/scanner-login');
      return;
    }
    
    try {
      const user = JSON.parse(userData);
      setScannerUser(user);
      fetchScanHistory();
      fetchScanStats();
      
      // Check if camera API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setBarcodeSupported(false);
        logger.warn('Camera API not available on this device');
      } else {
        // Initialize ZXing reader
        codeReaderRef.current = new BrowserMultiFormatReader();
        logger.info('ZXing barcode reader initialized');
      }
    } catch (error) {
      toast.error('Error parsing user data');
      localStorage.removeItem('scanner_user');
      navigate('/scanner-login');
    }
  }, [navigate]);

  const fetchScanHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_scans')
        .select(`
          id,
          ticket_order_id,
          scanned_at,
          ticket_orders!inner (
            customer_name,
            quantity,
            tickets!inner (
              ticket_type,
              matches!inner (
                home_team,
                away_team
              )
            )
          )
        `)
        .order('scanned_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data) {
        const formattedHistory: ScanHistoryItem[] = data.map(scan => ({
          id: scan.id,
          ticket_order_id: scan.ticket_order_id,
          customer_name: scan.ticket_orders.customer_name,
          ticket_type: scan.ticket_orders.tickets.ticket_type,
          match_info: `${scan.ticket_orders.tickets.matches.home_team} vs ${scan.ticket_orders.tickets.matches.away_team}`,
          quantity: scan.ticket_orders.quantity,
          scanned_at: scan.scanned_at,
          status: 'success'
        }));
        setScanHistory(formattedHistory);
      }
    } catch (error) {
      logger.error('Failed to fetch scan history', { error });
      toast.error('Gagal mengambil riwayat scan');
    }
  };

  const fetchScanStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Total scans
      const { count: totalScans } = await supabase
        .from('ticket_scans')
        .select('*', { count: 'exact', head: true });

      // Today's scans
      const { count: todayScans } = await supabase
        .from('ticket_scans')
        .select('*', { count: 'exact', head: true })
        .gte('scanned_at', today);

      // Unique customers
      const { data: uniqueCustomers } = await supabase
        .from('ticket_scans')
        .select(`
          ticket_orders!inner (
            customer_name
          )
        `);

      const uniqueNames = new Set(uniqueCustomers?.map(s => s.ticket_orders.customer_name));

      setScanStats({
        total_scans: totalScans || 0,
        successful_scans: totalScans || 0,
        today_scans: todayScans || 0,
        unique_customers: uniqueNames.size
      });
    } catch (error) {
      logger.error('Failed to fetch scan stats', { error });
      toast.error('Gagal mengambil statistik');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('scanner_user');
    toast.success('Logout berhasil');
    navigate('/scanner-login');
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketId.trim()) {
      toast.error('ID Tiket harus diisi');
      return;
    }

    setLoading(true);
    setLastScanResult(null);
    
    try {
      const { data, error } = await supabase.rpc('scan_ticket', {
        _ticket_order_id: ticketId.trim(),
        _scanner_user_id: scannerUser?.id
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('Tidak ada response dari sistem');
      }

      const result = data[0] as ScanResult;
      setLastScanResult(result);
      
      if (result.success) {
        toast.success(result.message);
        fetchScanHistory();
        fetchScanStats();
      } else {
        toast.error(result.message);
      }
      
      setTicketId('');
    } catch (error: any) {
      logger.error('Manual scan failed', { ticketId, error });
      toast.error(error.message || 'Terjadi kesalahan saat scanning');
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeDetected = useCallback(async (result: string) => {
    const currentTime = Date.now();
    const trimmedResult = result.trim();
    
    // Enhanced debouncing and duplicate detection
    if (isProcessingScan || 
        (currentTime - lastScanTime < 5000) || 
        trimmedResult === lastScannedCode) {
      logger.debug('Barcode scan ignored', { 
        result: trimmedResult, 
        isProcessing: isProcessingScan,
        timeSince: currentTime - lastScanTime,
        isDuplicate: trimmedResult === lastScannedCode
      });
      return;
    }
    
    // Prevent further scans
    setIsProcessingScan(true);
    setLastScanTime(currentTime);
    setLastScannedCode(trimmedResult);
    setTicketId(trimmedResult);
    
    logger.info('Barcode detected', { result: trimmedResult });
    
    // Stop scanning immediately to prevent multiple triggers
    stopBarcodeScanning();
    
    setLoading(true);
    setLastScanResult(null);
    
    try {
      const { data, error } = await supabase.rpc('scan_ticket', {
        _ticket_order_id: trimmedResult,
        _scanner_user_id: scannerUser?.id
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('Tidak ada response dari sistem');
      }

      const scanResult = data[0] as ScanResult;
      setLastScanResult(scanResult);
      
      if (scanResult.success) {
        toast.success(`✅ Tiket Valid: ${scanResult.message}`);
        logger.info('Barcode scan successful', { result: trimmedResult, message: scanResult.message });
        fetchScanHistory();
        fetchScanStats();
      } else {
        toast.error(`❌ Tiket Invalid: ${scanResult.message}`);
        logger.warn('Barcode scan failed', { result: trimmedResult, message: scanResult.message });
      }
      
      setTicketId('');
    } catch (error: any) {
      logger.error('Barcode scan processing error', { result: trimmedResult, error });
      toast.error(`Kesalahan: ${error.message || 'Terjadi kesalahan saat scanning'}`);
    } finally {
      setLoading(false);
      // Reset processing state after a delay to allow for proper debouncing
      setTimeout(() => {
        setIsProcessingScan(false);
      }, 1000);
    }
  }, [lastScanTime, lastScannedCode, isProcessingScan, scannerUser?.id]);

  const startBarcodeScanning = async () => {
    if (!barcodeSupported || !codeReaderRef.current) {
      toast.error('Barcode scanning tidak didukung pada perangkat ini');
      return;
    }

    try {
      setIsScanning(true);
      logger.info('Starting barcode scanning');
      
      // Get available video devices
      const videoInputDevices = await navigator.mediaDevices.enumerateDevices();
      const cameras = videoInputDevices.filter(device => device.kind === 'videoinput');
      
      if (cameras.length === 0) {
        throw new Error('No camera devices found');
      }
      
      // Prefer rear camera if available
      const rearCamera = cameras.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      
      const selectedDeviceId = rearCamera?.deviceId || cameras[0].deviceId;
      
      logger.info('Selected camera device', { 
        deviceId: selectedDeviceId, 
        label: rearCamera?.label || cameras[0].label 
      });

      // Start decoding from video device
      await codeReaderRef.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current!,
        (result, error) => {
          if (result && !isProcessingScan && isScanning) {
            handleBarcodeDetected(result.getText());
          }
          if (error && error.name !== 'NotFoundException' && error.name !== 'ChecksumException') {
            logger.debug('Barcode scanning error (non-critical)', { error: error.message });
          }
        }
      );
      
      toast.info('📷 Arahkan kamera ke barcode tiket');
      
    } catch (error: any) {
      setIsScanning(false);
      let errorMessage = 'Tidak dapat mengakses kamera';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Akses kamera ditolak. Silakan izinkan akses kamera di browser.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'Kamera tidak ditemukan pada perangkat ini.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Kamera tidak didukung pada perangkat ini.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      logger.error('Failed to start barcode scanning', { error });
      toast.error(errorMessage);
    }
  };


  const stopBarcodeScanning = () => {
    setIsScanning(false);
    logger.info('Stopping barcode scanning');
    
    try {
      // Stop all video streams first
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
        videoRef.current.srcObject = null;
        videoRef.current.load(); // Force reload to clear any cached stream
      }
      
      // Recreate the reader to ensure clean state
      if (codeReaderRef.current) {
        codeReaderRef.current = new BrowserMultiFormatReader();
      }
      
      logger.debug('ZXing reader and camera streams stopped successfully');
    } catch (error) {
      logger.warn('Error stopping ZXing reader', { error });
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        try {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          logger.debug('Camera streams cleaned up on unmount');
        } catch (error) {
          logger.warn('Error cleaning up camera streams', { error });
        }
      }
    };
  }, []);

  const getScanStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getScanStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"} className="mb-2">
        {success ? "VALID" : "INVALID"}
      </Badge>
    );
  };

  if (!scannerUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-lg border border-border bg-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="p-3 bg-primary rounded-full shadow-lg">
                    <QrCode className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-card"></div>
                </div>
                <div>
                  <CardTitle className="text-xl text-primary">
                    Persiraja Ticket Scanner
                  </CardTitle>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {scannerUser.full_name || scannerUser.username}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="scanner" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-card border border-border shadow-lg">
            <TabsTrigger value="scanner" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Scan className="h-4 w-4" />
              Scanner
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <History className="h-4 w-4" />
              Riwayat
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="h-4 w-4" />
              Statistik
            </TabsTrigger>
          </TabsList>

          {/* Scanner Tab */}
          <TabsContent value="scanner" className="space-y-6">
            {/* Quick Guide */}
            <Card className="shadow-lg border border-border bg-card border-l-4 border-l-primary">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Info className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm mb-1">Panduan Cepat</h3>
                    <p className="text-xs text-muted-foreground">
                      1. Pilih metode scan: Manual input atau Barcode scanner
                      2. Masukkan ID tiket atau scan barcode
                      3. Sistem akan memvalidasi tiket secara otomatis
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Scanner Methods */}
              <Card className="shadow-lg border border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scan className="h-5 w-5" />
                    Metode Scanning
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={scanMethod === 'manual' ? 'default' : 'outline'}
                      onClick={() => {
                        setScanMethod('manual');
                        if (isScanning) stopBarcodeScanning();
                      }}
                      className="flex items-center gap-2"
                    >
                      <Hand className="h-4 w-4" />
                      Manual
                    </Button>
                    <Button
                      variant={scanMethod === 'barcode' ? 'default' : 'outline'}
                      onClick={() => setScanMethod('barcode')}
                      disabled={!barcodeSupported}
                      className="flex items-center gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      Barcode
                    </Button>
                  </div>

                  {scanMethod === 'manual' ? (
                    <form onSubmit={handleScan} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="ticketId">ID Tiket</Label>
                        <Input
                          id="ticketId"
                          type="text"
                          value={ticketId}
                          onChange={(e) => setTicketId(e.target.value)}
                          placeholder="Masukkan ID tiket..."
                          disabled={loading}
                        />
                      </div>
                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? 'Scanning...' : 'Scan Tiket'}
                      </Button>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative bg-black rounded-lg overflow-hidden">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-48 object-cover"
                        />
                        {!isScanning && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <Button
                              onClick={startBarcodeScanning}
                              disabled={!barcodeSupported}
                              className="flex items-center gap-2"
                            >
                              <Camera className="h-4 w-4" />
                              Mulai Scan
                            </Button>
                          </div>
                        )}
                        {isScanning && (
                          <div className="absolute inset-0 border-2 border-primary">
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-2 border-t-2 border-b-2 border-primary"></div>
                          </div>
                        )}
                      </div>
                      
                      {isScanning && (
                        <Button
                          onClick={stopBarcodeScanning}
                          variant="outline"
                          className="w-full"
                        >
                          Stop Scanning
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Scan Result */}
              <Card className="shadow-lg border border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Hasil Scan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {lastScanResult ? (
                    <div className="space-y-4">
                      {getScanStatusBadge(lastScanResult.success)}
                      
                      <div className="flex items-start gap-3">
                        {getScanStatusIcon(lastScanResult.success)}
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-2">
                            {lastScanResult.message}
                          </p>
                          
                          {lastScanResult.ticket_info && (
                            <div className="space-y-2 text-sm text-muted-foreground">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="font-medium">Nama:</span>
                                  <p>{lastScanResult.ticket_info.customer_name}</p>
                                </div>
                                <div>
                                  <span className="font-medium">Tipe Tiket:</span>
                                  <p>{lastScanResult.ticket_info.ticket_type}</p>
                                </div>
                                <div>
                                  <span className="font-medium">Pertandingan:</span>
                                  <p>{lastScanResult.ticket_info.match_info}</p>
                                </div>
                                <div>
                                  <span className="font-medium">Jumlah:</span>
                                  <p>{lastScanResult.ticket_info.quantity}</p>
                                </div>
                              </div>
                              {lastScanResult.ticket_info.scanned_at && (
                                <div>
                                  <span className="font-medium">Waktu Scan:</span>
                                  <p>{new Date(lastScanResult.ticket_info.scanned_at).toLocaleString('id-ID')}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Belum ada hasil scan</p>
                      <p className="text-sm">Scan tiket untuk melihat hasilnya</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="shadow-lg border border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Riwayat Scan Tiket
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scanHistory.length > 0 ? (
                  <div className="space-y-4">
                    {scanHistory.map((scan) => (
                      <div key={scan.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getScanStatusIcon(scan.status === 'success')}
                          <div>
                            <p className="font-medium">{scan.customer_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {scan.match_info} • {scan.ticket_type}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{scan.quantity}x</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(scan.scanned_at).toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Belum ada riwayat scan</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="shadow-lg border border-border bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{scanStats.total_scans}</p>
                      <p className="text-sm text-muted-foreground">Total Scan</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border border-border bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 rounded-full">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{scanStats.successful_scans}</p>
                      <p className="text-sm text-muted-foreground">Scan Berhasil</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border border-border bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-full">
                      <Clock className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{scanStats.today_scans}</p>
                      <p className="text-sm text-muted-foreground">Scan Hari Ini</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border border-border bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-full">
                      <Users className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{scanStats.unique_customers}</p>
                      <p className="text-sm text-muted-foreground">Customer Unik</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}