import { QRCodeSVG } from 'qrcode.react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from '@phosphor-icons/react'
import { getNetworkUrl, isLocalhostUrl } from '@/lib/network-url'

interface QRCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QRCodeDialog({ open, onOpenChange }: QRCodeDialogProps) {
  const url = getNetworkUrl()
  const isLocalhost = isLocalhostUrl()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Open on Mobile</DialogTitle>
          <DialogDescription>
            Scan this QR code with your phone's camera to open this page on your mobile device
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="bg-white p-4 rounded-lg">
            <QRCodeSVG 
              value={url} 
              size={200}
              level="M"
              includeMargin={false}
            />
          </div>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground break-all">
              {url}
            </p>
            
            {isLocalhost && (
              <Alert className="bg-amber-500/10 border-amber-500/30 text-left">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  This is a localhost URL. Make sure your phone is on the same network and replace 'localhost' with your computer's IP address if needed.
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground text-center">
            <p>📱 Point your phone's camera at the QR code</p>
            <p>Tap the notification to open the link</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
