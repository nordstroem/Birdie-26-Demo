import java.awt.Color;
import java.awt.Graphics;

import javax.swing.JFrame;
import javax.swing.JPanel;


public class NavierStokesWater {
	private int N;
	private int size;
	private double[] u, v, u_prev, v_prev, dens, dens_prev;
	public NavierStokesWater() {
		N = 100;
		size=(N+2)*(N+2);
		u = new double[size];
		v = new double[size];
		u_prev = new double[size];
		v_prev = new double[size];
		dens = new double[size];
		dens_prev = new double[size];
		
		JFrame frame = new JFrame();
		frame.setSize(500, 500);
		frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		JPanel panel = new JPanel();
		frame.add(panel);
		frame.setVisible(true);
		
		double dt = 1; // ?
		double visc = 2.0; // ??
		double diff = 2.0;
		
		 
		
		/*double[] a = new double[]{1,2,3};
		double[] b = new double[]{4,5,6};
		SWAP(a, b);
		System.out.println(a[0]);
		System.out.println(b[0]);*/
		
		
		
		while ( true ) {
			long t0 = System.currentTimeMillis();
			//get_from_UI ( dens_prev, u_prev, v_prev );
			dens_prev[IX(50, 2)] += 40; 
			//u_prev[IX(25,25)] = -100; 
			v_prev[IX(50,2)] = 1;
			
			vel_step ( N, u, v, u_prev, v_prev, visc, dt );
			dens_step ( N, dens, dens_prev, u, v, diff, dt );
			draw_dens (panel.getGraphics());
			System.out.println(System.currentTimeMillis() - t0);
			try {
				Thread.sleep(16);
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}

	}
	
	private void SWAP(double[] x0, double[] x) {
		/*double[] tmp=x0;
		x0=x;
		x=tmp;*/
		double[] tmp = new double[x0.length];
		for (int i = 0; i < tmp.length; i++) {
			tmp[i] = x0[i];
		}
		for (int i = 0; i < tmp.length; i++) {
			x0[i] = x[i];
		}
		for (int i = 0; i < tmp.length; i++) {
			x[i] = tmp[i];
		}
	}
	
	private void draw_dens(Graphics g) {
		int s = 5;
		for (int x = 0; x < N; x++) {
			for (int y = 0; y < N; y++) {
				double d = dens[IX(x, y)];
				int gs = (int) Math.min(d * 255, 255);
				g.setColor(new Color(gs, gs, gs));
				g.fillRect(x * s, y * s, s, s);
				//System.out.println(d);
			}
		}
	}
	
	private int IX(int i, int j) {
		return (i)+(N+2)*(j);
	}
	
	void add_source ( int N, double[] x, double[] s, double dt ){
		int i, size=(N+2)*(N+2);
		for ( i=0 ; i<size ; i++ ){
			x[i] += dt*s[i];
		} 
	}

	void diffuse ( int N, int b, double[] x, double[] x0, double diff, double dt )
	{
		int i, j, k;
		double a=dt*diff*N*N;
		for ( k=0 ; k<20 ; k++ ) {
			for ( i=1 ; i<=N ; i++ ) {
				for ( j=1 ; j<=N ; j++ ) {
					x[IX(i,j)] = (x0[IX(i,j)] + a*(x[IX(i-1,j)]+x[IX(i+1,j)]+
					 x[IX(i,j-1)]+x[IX(i,j+1)]))/(1+4*a);
				}
			}
			set_bnd( N, b, x );
		}
	}

	void advect ( int N, int b, double[] d, double[] d0, double[] u, double[] v, double dt ){
		int i, j, i0, j0, i1, j1;
		double x, y, s0, t0, s1, t1, dt0;
		dt0 = dt*N;
		for ( i=1 ; i<=N ; i++ ) {
			for ( j=1 ; j<=N ; j++ ) {
				x = i-dt0*u[IX(i,j)]; y = j-dt0*v[IX(i,j)];
				if (x<0.5){ 
					x=0.5; 
				} 
				if (x>N+0.5){ 
					x=N+ 0.5;
				} 
				i0=(int)x; i1=i0+1;
				if (y<0.5) {
					y=0.5; 
				}
				if (y>N+0.5) {
					y=N+ 0.5;
				} 
				j0=(int)y; j1=j0+1;
				s1 = x-i0; s0 = 1-s1; t1 = y-j0; t0 = 1-t1;
				d[IX(i,j)] = s0*(t0*d0[IX(i0,j0)]+t1*d0[IX(i0,j1)])+
				 s1*(t0*d0[IX(i1,j0)]+t1*d0[IX(i1,j1)]);
			}
		}
		set_bnd( N, b, d );
	}

	void dens_step ( int N, double[] x, double[] x0, double[] u, double[] v, double diff, double dt ){
		add_source ( N, x, x0, dt );
		SWAP ( x0, x ); diffuse ( N, 0, x, x0, diff, dt );
		SWAP ( x0, x ); advect ( N, 0, x, x0, u, v, dt );
	}
	
	
	
	
	void vel_step ( int N, double[] u, double[] v, double[] u0, double[] v0, double visc, double dt ) {
		add_source ( N, u, u0, dt ); add_source ( N, v, v0, dt );
		SWAP ( u0, u ); diffuse ( N, 1, u, u0, visc, dt );
		SWAP ( v0, v ); diffuse ( N, 2, v, v0, visc, dt );
		project ( N, u, v, u0, v0 );
		SWAP ( u0, u ); SWAP ( v0, v );
		advect ( N, 1, u, u0, u0, v0, dt ); advect ( N, 2, v, v0, u0, v0, dt );
		project ( N, u, v, u0, v0 );
	}

	void project ( int N, double[] u, double[] v, double[] p, double[] div ) {
		int i, j, k;
		double h;
		h = 1.0/N;
		for ( i=1 ; i<=N ; i++ ) {
			for ( j=1 ; j<=N ; j++ ) {
				div[IX(i,j)] = -0.5*h*(u[IX(i+1,j)]-u[IX(i-1,j)]+
				v[IX(i,j+1)]-v[IX(i,j-1)]);
				p[IX(i,j)] = 0;
			}
		}
		set_bnd ( N, 0, div ); set_bnd ( N, 0, p );
		for ( k=0 ; k<20 ; k++ ) {
			for ( i=1 ; i<=N ; i++ ) {
				for ( j=1 ; j<=N ; j++ ) {
					p[IX(i,j)] = (div[IX(i,j)]+p[IX(i-1,j)]+p[IX(i+1,j)]+
					 p[IX(i,j-1)]+p[IX(i,j+1)])/4;
				}
			}
			set_bnd ( N, 0, p );
		}
		for ( i=1 ; i<=N ; i++ ) {
			for ( j=1 ; j<=N ; j++ ) {
				u[IX(i,j)] -= 0.5*(p[IX(i+1,j)]-p[IX(i-1,j)])/h;
				v[IX(i,j)] -= 0.5*(p[IX(i,j+1)]-p[IX(i,j-1)])/h;
			}
		}
		set_bnd ( N, 1, u ); set_bnd ( N, 2, v );
	}
	
	void set_bnd ( int N, int b, double[] x ) {
		int i;
		for ( i=1 ; i<=N ; i++ ) {
			x[IX(0 ,i)] = b==1 ? -x[IX(1,i)] : x[IX(1,i)];
			x[IX(N+1,i)] = b==1 ? -x[IX(N,i)] : x[IX(N,i)];
			x[IX(i,0 )] = b==2 ? -x[IX(i,1)] : x[IX(i,1)];
			x[IX(i,N+1)] = b==2 ? -x[IX(i,N)] : x[IX(i,N)];
		}
		x[IX(0 ,0 )] = 0.5*(x[IX(1,0 )]+x[IX(0 ,1)]);
		x[IX(0 ,N+1)] = 0.5*(x[IX(1,N+1)]+x[IX(0 ,N )]);
		x[IX(N+1,0 )] = 0.5*(x[IX(N,0 )]+x[IX(N+1,1)]);
		x[IX(N+1,N+1)] = 0.5*(x[IX(N,N+1)]+x[IX(N+1,N )]);
		
		int n = 45;
		for ( i=1 ; i<=n ; i++ ) {
			x[IX(0 ,i)] = b==1 ? -x[IX(1,i)] : x[IX(1,i)];
			x[IX(n+1,i)] = b==1 ? -x[IX(n,i)] : x[IX(n,i)];
			x[IX(i,0 )] = b==2 ? -x[IX(i,1)] : x[IX(i,1)];
			x[IX(i,n+1)] = b==2 ? -x[IX(i,n)] : x[IX(i,n)];
		}
		x[IX(0 ,0 )] = 0.5*(x[IX(1,0 )]+x[IX(0 ,1)]);
		x[IX(0 ,n+1)] = 0.5*(x[IX(1,n+1)]+x[IX(0 ,n )]);
		x[IX(n+1,0 )] = 0.5*(x[IX(n,0 )]+x[IX(n+1,1)]);
		x[IX(n+1,n+1)] = 0.5*(x[IX(n,n+1)]+x[IX(n+1,n )]);
	}

	
	public static void main(String[] args) {
		new NavierStokesWater();
	}
}
