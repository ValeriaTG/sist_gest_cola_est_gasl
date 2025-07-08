import React, { useState } from 'react';
import { 
  HelpCircle, 
  Users, 
  Calendar, 
  CreditCard, 
  Settings, 
  Clock, 
  Fuel, 
  Phone, 
  Mail, 
  Shield,
  ChevronDown,
  ChevronRight,
  Play,
  CheckCircle,
  AlertCircle,
  Smartphone,
  QrCode,
  MapPin
} from 'lucide-react';
import { User } from '../types';

interface HelpPanelProps {
  currentUser: User | null;
  onShowLogin: () => void;
}

const HelpPanel: React.FC<HelpPanelProps> = ({ currentUser, onShowLogin }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('getting-started');

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const helpSections = [
    {
      id: 'getting-started',
      title: 'Primeros Pasos',
      icon: Play,
      color: 'bg-blue-500',
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">¡Bienvenido al Sistema de Gestión Inteligente!</h4>
            <p className="text-blue-700 text-sm mb-3">
              Este sistema te permite evitar las largas colas en la gasolinera mediante reservas y monitoreo en tiempo real.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-blue-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Únete a la cola virtual desde tu casa</span>
              </div>
              <div className="flex items-center text-blue-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Haz reservas para horarios específicos</span>
              </div>
              <div className="flex items-center text-blue-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Paga de forma segura online</span>
              </div>
              <div className="flex items-center text-blue-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Recibe notificaciones automáticas</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Navegación Rápida</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-2 text-blue-500" />
                <span>Panel Cliente - Únete a la cola</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2 text-green-500" />
                <span>Reservas - Programa tu visita</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CreditCard className="w-4 h-4 mr-2 text-purple-500" />
                <span>Pagos - Paga de forma segura</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <HelpCircle className="w-4 h-4 mr-2 text-orange-500" />
                <span>Ayuda - Guías y soporte</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'queue-system',
      title: 'Sistema de Cola Virtual',
      icon: Users,
      color: 'bg-green-500',
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">¿Cómo funciona la cola virtual?</h4>
            <div className="space-y-3 text-sm text-green-700">
              <div className="flex items-start">
                <span className="bg-green-200 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                <div>
                  <strong>Completa tus datos:</strong> Nombre, teléfono, email y tipo de combustible
                </div>
              </div>
              <div className="flex items-start">
                <span className="bg-green-200 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                <div>
                  <strong>Únete a la cola:</strong> El sistema te asigna automáticamente una posición
                </div>
              </div>
              <div className="flex items-start">
                <span className="bg-green-200 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                <div>
                  <strong>Recibe notificaciones:</strong> Te avisamos por SMS y email sobre tu turno
                </div>
              </div>
              <div className="flex items-start">
                <span className="bg-green-200 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
                <div>
                  <strong>Llega cuando sea tu turno:</strong> Sin esperas innecesarias
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              Tipos de Combustible Disponibles
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="font-medium">Regular</span>
                </div>
                <span className="text-gray-600">$1.25/L</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                  <span className="font-medium">Premium</span>
                </div>
                <span className="text-gray-600">$1.45/L</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="font-medium">Diesel</span>
                </div>
                <span className="text-gray-600">$1.35/L</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'reservations',
      title: 'Sistema de Reservas',
      icon: Calendar,
      color: 'bg-purple-500',
      content: (
        <div className="space-y-4">
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-semibold text-purple-800 mb-2">Reserva tu horario preferido</h4>
            <p className="text-purple-700 text-sm mb-3">
              Programa tu visita con hasta 7 días de anticipación y evita completamente las colas.
            </p>
            <div className="space-y-2 text-sm text-purple-700">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Selecciona fecha y hora (slots de 30 minutos)</span>
              </div>
              <div className="flex items-center">
                <Fuel className="w-4 h-4 mr-2" />
                <span>Elige tipo de combustible y cantidad estimada</span>
              </div>
              <div className="flex items-center">
                <CreditCard className="w-4 h-4 mr-2" />
                <span>Calcula el costo total automáticamente</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                <span>Recibe confirmación por email</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Horarios Disponibles</h4>
            <div className="text-sm text-gray-600">
              <p className="mb-2"><strong>Lunes a Domingo:</strong> 8:00 AM - 8:00 PM</p>
              <p className="mb-2"><strong>Slots disponibles:</strong> Cada 30 minutos</p>
              <p><strong>Reserva máxima:</strong> 7 días de anticipación</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'payments',
      title: 'Sistema de Pagos',
      icon: CreditCard,
      color: 'bg-emerald-500',
      content: (
        <div className="space-y-4">
          <div className="bg-emerald-50 rounded-lg p-4">
            <h4 className="font-semibold text-emerald-800 mb-2">Métodos de Pago Seguros</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center text-sm text-emerald-700">
                <CreditCard className="w-4 h-4 mr-2" />
                <span>Tarjeta de Crédito</span>
              </div>
              <div className="flex items-center text-sm text-emerald-700">
                <CreditCard className="w-4 h-4 mr-2" />
                <span>Tarjeta de Débito</span>
              </div>
              <div className="flex items-center text-sm text-emerald-700">
                <Smartphone className="w-4 h-4 mr-2" />
                <span>Pago Digital</span>
              </div>
              <div className="flex items-center text-sm text-emerald-700">
                <QrCode className="w-4 h-4 mr-2" />
                <span>Efectivo en Caja</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Seguridad Garantizada
            </h4>
            <div className="space-y-2 text-sm text-blue-700">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Encriptación SSL de extremo a extremo</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Integración con Stripe (PCI DSS compliant)</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>No almacenamos datos de tarjetas</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Confirmación inmediata de transacciones</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'notifications',
      title: 'Notificaciones Automáticas',
      icon: Phone,
      color: 'bg-orange-500',
      content: (
        <div className="space-y-4">
          <div className="bg-orange-50 rounded-lg p-4">
            <h4 className="font-semibold text-orange-800 mb-2">Te mantenemos informado</h4>
            <p className="text-orange-700 text-sm mb-3">
              Recibe actualizaciones automáticas por SMS y email en cada paso del proceso.
            </p>
            <div className="space-y-2 text-sm text-orange-700">
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                <span>SMS cuando te unes a la cola</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                <span>Email de confirmación de reservas</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span>Aviso cuando sea tu turno</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Confirmación de pagos procesados</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Configuración de Notificaciones</h4>
            <p className="text-gray-600 text-sm">
              Asegúrate de proporcionar un número de teléfono y email válidos para recibir todas las notificaciones.
              Las notificaciones son gratuitas y te ayudan a optimizar tu tiempo.
            </p>
          </div>
        </div>
      )
    }
  ];

  const adminSection = {
    id: 'admin-access',
    title: 'Acceso de Administrador',
    icon: Settings,
    color: 'bg-red-500',
    content: (
      <div className="space-y-4">
        <div className="bg-red-50 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-2 flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            Panel de Administración
          </h4>
          <p className="text-red-700 text-sm mb-3">
            El panel de administración está restringido solo para personal autorizado de la estación de servicio.
          </p>
          
          {!currentUser ? (
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3 border border-red-200">
                <h5 className="font-medium text-red-800 mb-2">Credenciales de Demostración:</h5>
                <div className="text-sm text-red-700 space-y-1">
                  <p><strong>Usuario:</strong> admin</p>
                  <p><strong>Contraseña:</strong> 1234</p>
                </div>
              </div>
              
              <button
                onClick={onShowLogin}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
              >
                <Shield className="w-4 h-4 mr-2" />
                Acceder al Panel de Administración
              </button>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center text-green-800">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">Sesión activa como: <strong>{currentUser.name}</strong></span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">Funciones del Administrador</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              <span>Control de estado de bombas</span>
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              <span>Gestión de cola de clientes</span>
            </div>
            <div className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              <span>Analíticas y reportes en tiempo real</span>
            </div>
            <div className="flex items-center">
              <CreditCard className="w-4 h-4 mr-2" />
              <span>Monitoreo de transacciones</span>
            </div>
          </div>
        </div>
      </div>
    )
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
        <div className="flex items-center mb-4">
          <HelpCircle className="w-12 h-12 mr-4" />
          <div>
            <h1 className="text-3xl font-bold">Centro de Ayuda</h1>
            <p className="text-blue-100">Guía completa para usar el sistema de gestión inteligente</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <MapPin className="w-5 h-5 mr-2" />
              <span className="font-semibold">Ubicación</span>
            </div>
            <p className="text-blue-100 text-sm">Av. Principal 123, Ciudad</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Clock className="w-5 h-5 mr-2" />
              <span className="font-semibold">Horarios</span>
            </div>
            <p className="text-blue-100 text-sm">24 horas, 7 días a la semana</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Phone className="w-5 h-5 mr-2" />
              <span className="font-semibold">Soporte</span>
            </div>
            <p className="text-blue-100 text-sm">+1 (555) 123-4567</p>
          </div>
        </div>
      </div>

      {/* Help Sections */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Guías de Usuario</h2>
          <p className="text-gray-600 mt-1">Aprende a usar todas las funcionalidades del sistema</p>
        </div>

        <div className="divide-y divide-gray-200">
          {helpSections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSection === section.id;
            
            return (
              <div key={section.id}>
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-lg ${section.color} flex items-center justify-center mr-4`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-gray-800">{section.title}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="px-6 pb-6">
                    {section.content}
                  </div>
                )}
              </div>
            );
          })}

          {/* Admin Section */}
          <div>
            <button
              onClick={() => toggleSection(adminSection.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-lg ${adminSection.color} flex items-center justify-center mr-4`}>
                  <adminSection.icon className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-gray-800">{adminSection.title}</span>
              </div>
              {expandedSection === adminSection.id ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              )}
            </button>
            
            {expandedSection === adminSection.id && (
              <div className="px-6 pb-6">
                {adminSection.content}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
          <div className="flex items-center mb-3">
            <Users className="w-8 h-8 text-blue-600 mr-3" />
            <h3 className="font-semibold text-gray-800">Únete a la Cola</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">Evita las esperas físicas uniéndote a la cola virtual</p>
          <div className="text-blue-600 text-sm font-medium">→ Panel Cliente</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
          <div className="flex items-center mb-3">
            <Calendar className="w-8 h-8 text-green-600 mr-3" />
            <h3 className="font-semibold text-gray-800">Haz una Reserva</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">Programa tu visita con hasta 7 días de anticipación</p>
          <div className="text-green-600 text-sm font-medium">→ Panel Reservas</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500">
          <div className="flex items-center mb-3">
            <CreditCard className="w-8 h-8 text-purple-600 mr-3" />
            <h3 className="font-semibold text-gray-800">Pago Seguro</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">Procesa pagos de forma rápida y segura online</p>
          <div className="text-purple-600 text-sm font-medium">→ Panel Pagos</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-orange-500">
          <div className="flex items-center mb-3">
            <Smartphone className="w-8 h-8 text-orange-600 mr-3" />
            <h3 className="font-semibold text-gray-800">App Móvil</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">Descarga nuestra app para una experiencia completa</p>
          <div className="text-orange-600 text-sm font-medium">→ Próximamente</div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Preguntas Frecuentes</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">¿Es gratis usar el sistema?</h3>
            <p className="text-gray-600 text-sm">
              Sí, el uso del sistema de colas y reservas es completamente gratuito. Solo pagas por el combustible que consumes.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-2">¿Qué pasa si llego tarde a mi reserva?</h3>
            <p className="text-gray-600 text-sm">
              Tienes una ventana de 15 minutos de tolerancia. Después de ese tiempo, tu reserva se libera automáticamente.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-2">¿Puedo cancelar mi reserva?</h3>
            <p className="text-gray-600 text-sm">
              Sí, puedes cancelar tu reserva hasta 30 minutos antes del horario programado sin ningún costo.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-2">¿Cómo sé cuándo es mi turno?</h3>
            <p className="text-gray-600 text-sm">
              Recibirás notificaciones automáticas por SMS y email cuando sea tu turno. También puedes verificar en tiempo real en la página.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPanel;